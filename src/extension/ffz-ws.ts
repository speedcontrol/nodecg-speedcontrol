import { NodeCG, Replicant } from 'nodecg/types/server'; // eslint-disable-line
import { forEachSeries } from 'p-iteration';
import TwitchJS from 'twitch-js';
import WebSocket from 'ws';
import { Configschema } from '../../configschema';
import { TwitchAPIData } from '../../schemas';
import * as events from './util/events';
import Helpers from './util/helpers';

const { randomInt, to, cgListenForHelper } = Helpers;

export default class FFZWS {
  /* eslint-disable */
  private nodecg: NodeCG;
  private h: Helpers;
  private config: Configschema;
  private twitchAPIData: Replicant<TwitchAPIData>
  private ws: WebSocket | undefined;
  private msgNo = 1;
  private pingTO: NodeJS.Timeout | undefined;
  /* eslint-enable */

  constructor(nodecg: NodeCG) {
    this.nodecg = nodecg;
    this.h = new Helpers(nodecg);
    this.config = this.h.bundleConfig();
    this.twitchAPIData = nodecg.Replicant('twitchAPIData');

    if (this.config.twitch.enabled && this.config.twitch.ffzIntegration) {
      nodecg.log.info('FrankerFaceZ integration is enabled.');

      // NodeCG messaging system.
      this.nodecg.listenFor('updateFeaturedChannels', (data, ack): void => {
        cgListenForHelper(this.setChannels(data), ack);
      });

      // Our messaging system.
      events.listenFor('updateFeaturedChannels', (data, ack): void => {
        this.setChannels(data)
          .then((): void => { ack(null); })
          .catch((err): void => { ack(err); });
      });

      this.twitchAPIData.on('change', (newVal, oldVal): void => {
        if (newVal.state === 'on' && (!oldVal || oldVal.state !== 'on')) {
          this.connect();
        } else if (this.ws && oldVal && oldVal.state === 'on' && newVal.state !== 'on') {
          nodecg.log.info('Connection to FrankerFaceZ closed.');
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
    this.nodecg.log.info('Connecting to FrankerFaceZ (%s).', url);

    this.ws.once('open', (): void => {
      this.sendInitMsgs().then((): void => {
        this.pingTO = setTimeout((): void => this.ping(), 60 * 1000);
        this.nodecg.log.info('Connection to FrankerFaceZ successful.');
      });
    });

    // Catching any errors with the connection.
    // The "close" event is also fired if it's a disconnect.
    this.ws.on('error', (err): void => {
      this.nodecg.log.warn('Error occurred on the FrankerFaceZ connection: %s', err);
    });

    this.ws.once('close', (): void => {
      clearTimeout(this.pingTO as NodeJS.Timeout);
      if (this.twitchAPIData.value.state === 'on') { // No reconnection if Twitch API is disconnected.
        this.nodecg.log.warn('Connection to FrankerFaceZ closed, will reconnect in 10 seconds.');
        setTimeout((): void => this.connect(), 10 * 1000);
      }
    });

    this.ws.on('message', (data: string): void => {
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
          this.nodecg.log.debug('Got follow_buttons from FrankerFaceZ connection.');
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
      forEachSeries(messagesToSend, async (msg): Promise<void> => {
        await this.sendMsg(msg);
      }).then(resolve).catch((): void => {});
    });
  }

  /**
   * Sends messages to the WebSocket server, correctly formatted.
   * @param msg Message to be sent.
   */
  sendMsg(msg: string): Promise<string> {
    return new Promise((resolve, reject): void => {
      if (!this.ws || this.ws.readyState !== 1) {
        reject(new Error('FrankerFaceZ WebSocket not connected.'));
        return;
      }
      this.ws.send(`${this.msgNo} ${msg}`);
      const thisMsgNo = this.msgNo;
      this.msgNo += 1;
      const msgEvt = (data: string): void => {
        if (this.ws && data.includes(`${thisMsgNo} ok`)) {
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
    this.nodecg.log.info('Attempting to authenticate with FrankerFaceZ.');
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
        this.nodecg.log.info('Connected to Twitch chat to authenticate with FrankerFaceZ.');
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
        reject(new Error('FrankerFaceZ integration is not enabled.'));
        return;
      }
      if (!this.config.twitch.ffzUseRepeater && this.config.twitch.channelName) {
        reject(new Error(`FrankerFaceZ featured channels cannot be set while
        channelName is set in the configuration file.`));
        return;
      }
      this.nodecg.log.info('Attempting to set FrankerFaceZ featured channels.');

      // Remove any blacklisted names.
      const toSend = names.filter((name): boolean => (
        !(this.config.twitch.ffzBlacklist || [])
          .map((x): string => x.toLowerCase())
          .includes(name.toLowerCase())
      ));

      if (!this.config.twitch.ffzUseRepeater) {
        this.sendMsg(
          `update_follow_buttons ${JSON.stringify([
            this.twitchAPIData.value.channelName,
            toSend,
          ])}`,
        ).then((msg): void => {
          const clients = JSON.parse(msg.substr(3)).updated_clients;
          this.nodecg.log.info(`FrankerFaceZ featured channels have been updated for ${clients} viewers.`);
          resolve();
        }).catch((err): void => {
          this.nodecg.log.warn('FrankerFaceZ featured channels could not successfully be updated.');
          this.nodecg.log.debug('FrankerFaceZ featured channels could not successfully be updated:', err);
          reject(err);
        });
      } else { // Send out message for external code to listen to.
        this.nodecg.sendMessage('updateFFZFollowing', toSend);
        this.nodecg.log.info('FrankerFaceZ featured channels being sent to repeater code.');
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
    }

    const pongEvt = (): void => {
      clearTimeout(pongWaitTO);
      this.pingTO = setTimeout((): void => this.ping(), 60 * 1000);
      if (this.ws) {
        this.ws.removeListener('pong', pongEvt);
      }
    };
    if (this.ws) {
      this.ws.on('pong', pongEvt);
    }

    // Disconnect if a PONG was not received within 10 seconds.
    pongWaitTO = setTimeout((): void => {
      this.nodecg.log.warn('FrankerFaceZ PING/PONG failed, terminating connection.');
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
    switch (randomInt(0, 7)) {
      default:
      case 0:
        return 'wss://catbag.frankerfacez.com/';
      case 1:
      case 2:
        return 'wss://andknuckles.frankerfacez.com/';
      case 3:
      case 4:
        return 'wss://tuturu.frankerfacez.com/';
      case 5:
      case 6:
        return 'wss://lilz.frankerfacez.com/';
    }
  }
}
