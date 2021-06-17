/* eslint import/prefer-default-export: off */

import { forEachSeries } from 'p-iteration';
import TMI from 'tmi.js';
import WebSocket from 'ws';
import { refreshToken } from './twitch-api';
import * as events from './util/events';
import { bundleConfig, processAck, randomInt, to } from './util/helpers'; // eslint-disable-line object-curly-newline, max-len
import { get } from './util/nodecg';
import { twitchAPIData } from './util/replicants';

const nodecg = get();
const config = bundleConfig();
let ws: WebSocket;
let msgNo = 1;
let pingTO: NodeJS.Timeout;

/**
 * Sends messages to the WebSocket server, correctly formatted.
 * @param msg Message to be sent.
 */
function sendMsg(msg: string): Promise<string> {
  return new Promise((resolve) => {
    if (!ws || ws.readyState !== 1) {
      throw new Error('WebSocket not connected');
    }
    nodecg.log.debug(`[FrankerFaceZ] Attempting to send message: ${msgNo} ${msg}`);
    ws.send(`${msgNo} ${msg}`);
    const thisMsgNo = msgNo;
    msgNo += 1;
    const msgEvt = (data: string): void => {
      if (ws && data.includes(`${thisMsgNo} ok`)) {
        nodecg.log.debug(`[FrankerFaceZ] Message was successful: ${thisMsgNo} ${msg}`);
        ws.removeListener('message', msgEvt);
        resolve(data.substr(data.indexOf(' ') + 1));
      }
    };
    ws.on('message', msgEvt);
  });
}

/**
 * Sent authentication code over Twitch chat.
 * @param auth Authentication code.
 */
async function sendAuth(auth: string): Promise<void> {
  nodecg.log.debug('[FrankerFaceZ] Attempting authentication');
  const opts = {
    options: {
      // debug: true,
    },
    connection: {
      secure: true,
    },
    identity: {
      username: twitchAPIData.value.channelName,
      password: twitchAPIData.value.accessToken,
    },
  };

  let retry = false;
  let attempts = 0;
  /* eslint-disable no-await-in-loop */
  do {
    try {
      retry = false;
      attempts += 1;
      const client = new TMI.Client(opts);
      await client.connect();
      nodecg.log.debug('[FrankerFaceZ] Connected to Twitch chat to authenticate');
      await client.say('frankerfacezauthorizer', `AUTH ${auth}`);
      client.disconnect();
    } catch (err) {
      if (err.includes('authentication failed') && attempts <= 1) {
        await to(refreshToken());
        opts.identity.password = twitchAPIData.value.accessToken; // Update auth in opts.
        retry = true;
      }
    }
  } while (retry);
  /* eslint-enable */
}

/**
 * Set the featured channels.
 * @param names Array of usernames on Twitch.
 */
export async function setChannels(names: string[]): Promise<void> {
  if (!config.twitch.ffzIntegration) {
    throw new Error('Integration not enabled');
  }
  nodecg.log.info('[FrankerFaceZ] Attempting to set featured channels');

  // Remove any blacklisted names.
  const toSend = names.filter((name) => (
    !(config.twitch.ffzBlacklist || [])
      .map((x) => x.toLowerCase())
      .includes(name.toLowerCase())
  ));

  if (!config.twitch.ffzUseRepeater) {
    try {
      if (config.twitch.channelName) {
        throw new Error('Featured channels cannot be set while '
        + 'channelName is set in the configuration file');
      }
      const msg = await sendMsg(
        `update_follow_buttons ${JSON.stringify([
          twitchAPIData.value.channelName,
          toSend,
        ])}`,
      );
      const clients = JSON.parse(msg.substr(3)).updated_clients;
      nodecg.log.info(`[FrankerFaceZ] Featured channels have been updated for ${clients} viewers`);
    } catch (err) {
      nodecg.log.warn('[FrankerFaceZ] Featured channels could not successfully be updated');
      nodecg.log.debug('[FrankerFaceZ] Featured channels could not successfully be updated:', err);
      throw err;
    }
  } else { // Send out message for external code to listen to.
    to(events.sendMessage('repeaterFeaturedChannels', toSend));
    nodecg.sendMessage('repeaterFeaturedChannels', toSend);
    nodecg.log.info('[FrankerFaceZ] Featured channels being sent to repeater code');
  }
}

/**
 * Pings the WebSocket server to check the connection is still alive.
 */
function ping(): void {
  let pongWaitTO: NodeJS.Timeout;
  if (ws) {
    ws.ping();
    nodecg.log.debug('[FrankerFaceZ] PING sent');
  }

  const pongEvt = (): void => {
    nodecg.log.debug('[FrankerFaceZ] PONG received');
    clearTimeout(pongWaitTO);
    pingTO = setTimeout(ping, 60 * 1000);
    if (ws) {
      ws.removeListener('pong', pongEvt);
    }
  };
  if (ws) {
    ws.on('pong', pongEvt);
  }

  // Disconnect if a PONG was not received within 10 seconds.
  pongWaitTO = setTimeout(() => {
    nodecg.log.debug('[FrankerFaceZ] PING/PONG failed, terminating connection');
    if (ws) {
      ws.removeListener('pong', pongEvt);
      ws.terminate();
    }
  }, 10 * 1000);
}

/**
 * Picks a server to connect to randomly.
 */
function pickServer(): string {
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

/**
 * Sends the correct initial messages on WebSocket connect.
 */
async function sendInitMsgs(): Promise<void> {
  const messagesToSend = [
    'hello ["nodecg-speedcontrol",false]',
    `setuser "${twitchAPIData.value.channelName}"`,
    `sub "room.${twitchAPIData.value.channelName}"`,
    `sub "channel.${twitchAPIData.value.channelName}"`,
    'ready 0',
  ];
  await forEachSeries(messagesToSend, async (msg) => {
    await sendMsg(msg);
  });
}

/**
 * Connects to the WebSocket server.
 */
function connect(): void {
  msgNo = 1;
  const url = pickServer();
  ws = new WebSocket(url);
  nodecg.log.info('[FrankerFaceZ] Connecting');
  nodecg.log.debug(`[FrankerFaceZ] Using server ${url}`);

  ws.once('open', () => {
    sendInitMsgs().then(() => {
      pingTO = setTimeout(ping, 60 * 1000);
      nodecg.log.info('[FrankerFaceZ] Connection successful');
    });
  });

  // Catching any errors with the connection.
  // The "close" event is also fired if it's a disconnect.
  ws.on('error', (err) => {
    nodecg.log.warn('[FrankerFaceZ] Connection error occured');
    nodecg.log.debug('[FrankerFaceZ] Connection error occured:', err);
  });

  ws.once('close', () => {
    clearTimeout(pingTO as NodeJS.Timeout);
    // No reconnection if Twitch API is disconnected.
    if (twitchAPIData.value.state === 'on') {
      nodecg.log.warn('[FrankerFaceZ] Connection closed, will reconnect in 10 seconds');
      setTimeout(connect, 10 * 1000);
    }
  });

  ws.on('message', (data: string) => {
    if (data.startsWith('-1')) {
      // If we need to authorize, gets the auth code and does that.
      // Original command will still be executed once authed,
      // so no need for any other checking.
      if (data.includes('do_authorize')) {
        sendAuth(JSON.parse(data.substr(16)));
      }

      // This is returned when the follower buttons are updated
      // (including through this application).
      if (data.includes('follow_buttons')) {
        nodecg.log.debug('[FrankerFaceZ] Received follow_buttons');
        const channels: string[] = JSON.parse(data.substr(18))[
          twitchAPIData.value.channelName as string
        ];
        twitchAPIData.value.featuredChannels.splice(
          0,
          twitchAPIData.value.featuredChannels.length,
          ...channels,
        );
      }
    }
  });
}

if (config.twitch.enabled && config.twitch.ffzIntegration) {
  nodecg.log.info('[FrankerFaceZ] Integration enabled');

  twitchAPIData.on('change', (newVal, oldVal) => {
    if (newVal.state === 'on' && (!oldVal || oldVal.state !== 'on')) {
      connect();
    } else if (ws && oldVal && oldVal.state === 'on' && newVal.state !== 'on') {
      nodecg.log.info('[FrankerFaceZ] Connection closed');
      ws.close();
    }
  });
}

// NodeCG messaging system.
nodecg.listenFor('updateFeaturedChannels', (names, ack) => {
  setChannels(names)
    .then(() => processAck(ack, null))
    .catch((err) => processAck(ack, err));
});

// Our messaging system.
events.listenFor('updateFeaturedChannels', (names, ack) => {
  setChannels(names)
    .then(() => processAck(ack, null))
    .catch((err) => processAck(ack, err));
});
