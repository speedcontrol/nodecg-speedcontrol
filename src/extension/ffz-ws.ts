import { NodeCG, Replicant } from 'nodecg/types/server'; // eslint-disable-line
import { forEachSeries } from 'p-iteration';
import TwitchJS from 'twitch-js';
import WebSocket from 'ws';
import { Configschema } from '../../configschema';
import { TwitchAPIData } from '../../schemas';
import * as events from './util/events';
import Helpers from './util/helpers';

const { randomInt, to, processAck } = Helpers;

export default class FFZWS {
  /* eslint-disable lines-between-class-members */
  private h: Helpers;
  private config: Configschema;
  private twitchAPIData: Replicant<TwitchAPIData>
  private ws: WebSocket | undefined;
  private msgNo = 1;
  private pingTO: NodeJS.Timeout | undefined;
  /* eslint-enable lines-between-class-members */

  constructor(nodecg: NodeCG) {
    this.h = new Helpers(nodecg);
    this.config = this.h.bundleConfig();
    this.twitchAPIData = nodecg.Replicant('twitchAPIData');

    if (this.config.twitch.enabled && this.config.twitch.ffzIntegration) {
      nodecg.log.info('[FrankerFaceZ] Integration enabled.');

      // NodeCG messaging system.
      nodecg.listenFor('updateFeaturedChannels', (data, ack) => {
        this.setChannels(data)
          .then(() => processAck(null, ack))
          .catch((err) => processAck(err, ack));
      });

      // Our messaging system.
      events.listenFor('updateFeaturedChannels', (data, ack) => {
        this.setChannels(data)
          .then(() => ack(null))
          .catch((err) => ack(err));
      });

      this.twitchAPIData.on('change', (newVal, oldVal) => {
        if (newVal.state === 'on' && (!oldVal || oldVal.state !== 'on')) {
          this.connect();
        } else if (this.ws && oldVal && oldVal.state === 'on' && newVal.state !== 'on') {
          nodecg.log.info('[FrankerFaceZ] Connection closed.');
          this.ws.close();
        }
      });
    }
  }

  /**
   * Connects to the WebSocket server.
   */
  connect(): void {
    this.msgNo = 1;
    const url = FFZWS.pickServer();
    this.ws = new WebSocket(url);
    this.h.nodecg.log.info('[FrankerFaceZ] Connecting.');
    this.h.nodecg.log.debug('[FrankerFaceZ] Using server %s.', url);

    this.ws.once('open', () => {
      this.sendInitMsgs().then(() => {
        this.pingTO = setTimeout(() => this.ping(), 60 * 1000);
        this.h.nodecg.log.info('[FrankerFaceZ] Connection successful.');
      });
    });

    // Catching any errors with the connection.
    // The "close" event is also fired if it's a disconnect.
    this.ws.on('error', (err) => {
      this.h.nodecg.log.warn('[FrankerFaceZ] Connection error occured.');
      this.h.nodecg.log.debug('[FrankerFaceZ] Connection error occured:', err);
    });

    this.ws.once('close', () => {
      clearTimeout(this.pingTO as NodeJS.Timeout);
      if (this.twitchAPIData.value.state === 'on') { // No reconnection if Twitch API is disconnected.
        this.h.nodecg.log.warn('[FrankerFaceZ] Connection closed, will reconnect in 10 seconds.');
        setTimeout(() => this.connect(), 10 * 1000);
      }
    });

    this.ws.on('message', (data: string) => {
      if (data.startsWith('-1')) {
        // If we need to authorize, gets the auth code and does that.
        // Original command will still be executed once authed,
        // so no need for any other checking.
        if (data.includes('do_authorize')) {
          this.sendAuth(JSON.parse(data.substr(16)));
        }

        // This is returned when the follower buttons are updated
        // (including through this application).
        if (data.includes('follow_buttons')) {
          this.h.nodecg.log.debug('[FrankerFaceZ] Received follow_buttons.');
          const channels: string[] = JSON.parse(data.substr(18))[
            this.twitchAPIData.value.channelName as string
          ];
          this.twitchAPIData.value.featuredChannels.splice(
            0,
            this.twitchAPIData.value.featuredChannels.length,
            ...channels,
          );
        }
      }
    });
  }

  /**
   * Sends the correct initial messages on WebSocket connect.
   */
  sendInitMsgs(): Promise<void> {
    return new Promise((resolve): void => {
      const messagesToSend = [
        'hello ["nodecg-speedcontrol",false]',
        `setuser "${this.twitchAPIData.value.channelName}"`,
        `sub "room.${this.twitchAPIData.value.channelName}"`,
        `sub "channel.${this.twitchAPIData.value.channelName}"`,
        'ready 0',
      ];
      // eslint-disable-next-line no-async-promise-executor
      forEachSeries(messagesToSend, async (msg) => {
        await this.sendMsg(msg);
      }).then(resolve).catch(() => {});
    });
  }

  /**
   * Sends messages to the WebSocket server, correctly formatted.
   * @param msg Message to be sent.
   */
  sendMsg(msg: string): Promise<string> {
    return new Promise((resolve): void => {
      if (!this.ws || this.ws.readyState !== 1) {
        throw new Error('WebSocket not connected.');
      }
      this.h.nodecg.log.debug('[FrankerFaceZ] Attempting to send message: %s %s', this.msgNo, msg);
      this.ws.send(`${this.msgNo} ${msg}`);
      const thisMsgNo = this.msgNo;
      this.msgNo += 1;
      const msgEvt = (data: string): void => {
        if (this.ws && data.includes(`${thisMsgNo} ok`)) {
          this.h.nodecg.log.debug('[FrankerFaceZ] Message was successful: %s %s', thisMsgNo, msg);
          this.ws.removeListener('message', msgEvt);
          resolve(data.substr(data.indexOf(' ') + 1));
        }
      };
      this.ws.on('message', msgEvt);
    });
  }

  /**
   * Sent authentication code over Twitch chat.
   * @param auth Authentication code.
   */
  async sendAuth(auth: string): Promise<void> {
    this.h.nodecg.log.debug('[FrankerFaceZ] Attempting authentication.');
    const opts = {
      options: {
        // debug: true,
      },
      connection: {
        secure: true,
      },
      identity: {
        username: this.twitchAPIData.value.channelName,
        password: this.twitchAPIData.value.accessToken,
      },
    };

    let retry = false;
    let attempts = 0;
    do {
      try {
        retry = false;
        attempts += 1;
        const client = new TwitchJS.Client(opts);
        await client.connect(); // eslint-disable-line
        this.h.nodecg.log.debug('[FrankerFaceZ] Connected to Twitch chat to authenticate.');
        await client.say('frankerfacezauthorizer', `AUTH ${auth}`); // eslint-disable-line
        client.disconnect();
      } catch (err) {
        if (err.includes('authentication failed') && attempts <= 1) {
          await to(events.sendMessage('twitchRefreshToken')); // eslint-disable-line
          opts.identity.password = this.twitchAPIData.value.accessToken; // Update auth in opts.
          retry = true;
        }
      }
    } while (retry);
  }

  /**
   * Set the featured channels.
   * @param names Array of usernames on Twitch.
   */
  setChannels(names: string[]): Promise<void> {
    return new Promise((resolve, reject): void => {
      if (!this.config.twitch.ffzIntegration) {
        throw new Error('Integration not enabled.');
      }
      if (!this.config.twitch.ffzUseRepeater && this.config.twitch.channelName) {
        throw new Error(`Featured channels cannot be set while
        channelName is set in the configuration file.`);
      }
      this.h.nodecg.log.info('[FrankerFaceZ] Attempting to set featured channels.');

      // Remove any blacklisted names.
      const toSend = names.filter((name) => (
        !(this.config.twitch.ffzBlacklist || [])
          .map((x) => x.toLowerCase())
          .includes(name.toLowerCase())
      ));

      if (!this.config.twitch.ffzUseRepeater) {
        this.sendMsg(
          `update_follow_buttons ${JSON.stringify([
            this.twitchAPIData.value.channelName,
            toSend,
          ])}`,
        ).then((msg) => {
          const clients = JSON.parse(msg.substr(3)).updated_clients;
          this.h.nodecg.log.info(`[FrankerFaceZ] Featured channels have been updated for ${clients} viewers.`);
          resolve();
        }).catch((err) => {
          this.h.nodecg.log.warn('[FrankerFaceZ] Featured channels could not successfully be updated.');
          this.h.nodecg.log.debug('[FrankerFaceZ] Featured channels could not successfully be updated:', err);
          reject(err);
        });
      } else { // Send out message for external code to listen to.
        to(events.sendMessage('repeaterFeaturedChannels', toSend));
        this.h.nodecg.sendMessage('repeaterFeaturedChannels', toSend);
        this.h.nodecg.log.info('[FrankerFaceZ] Featured channels being sent to repeater code.');
      }
    });
  }

  /**
   * Pings the WebSocket server to check the connection is still alive.
   */
  ping(): void {
    let pongWaitTO: NodeJS.Timeout;
    if (this.ws) {
      this.ws.ping();
      this.h.nodecg.log.debug('[FrankerFaceZ] PING sent.');
    }

    const pongEvt = (): void => {
      this.h.nodecg.log.debug('[FrankerFaceZ] PONG received.');
      clearTimeout(pongWaitTO);
      this.pingTO = setTimeout(() => this.ping(), 60 * 1000);
      if (this.ws) {
        this.ws.removeListener('pong', pongEvt);
      }
    };
    if (this.ws) {
      this.ws.on('pong', pongEvt);
    }

    // Disconnect if a PONG was not received within 10 seconds.
    pongWaitTO = setTimeout(() => {
      this.h.nodecg.log.debug('[FrankerFaceZ] PING/PONG failed, terminating connection.');
      if (this.ws) {
        this.ws.removeListener('pong', pongEvt);
        this.ws.terminate();
      }
    }, 10 * 1000);
  }

  /**
   * Picks a server to connect to randomly.
   */
  static pickServer(): string {
    switch (randomInt(0, 20)) {
      default: case 0:
        return 'wss://catbag.frankerfacez.com/';
      case 1: case 2: case 3:
        return 'wss://andknuckles.frankerfacez.com/';
      case 4: case 5: case 6: case 7:
        return 'wss://tuturu.frankerfacez.com/';
      case 8: case 9: case 10: case 11:
        return 'wss://lilz.frankerfacez.com/';
      case 12: case 13: case 14: case 15:
        return 'wss://yoohoo.frankerfacez.com/';
      case 16: case 17: case 18: case 19:
        return 'wss://pog.frankerfacez.com/';
    }
  }
}
