import { CommercialDuration } from '@nodecg-speedcontrol/types';
import express from 'express'; // eslint-disable-line import/no-extraneous-dependencies
import needle, { BodyData, NeedleHttpVerbs, NeedleResponse } from 'needle';
import * as events from './util/events';
import { bundleConfig, processAck, to } from './util/helpers';
import { get } from './util/nodecg';
import { twitchAPIData, twitchChannelInfo, twitchCommercialTimer } from './util/replicants';

const nodecg = get();
const config = bundleConfig();
const app = express();
let channelInfoTO: NodeJS.Timeout;

twitchAPIData.value.state = 'off'; // Set this to "off" on every start.
if (!config.twitch.ffzUseRepeater) {
  // Empty on every start if not using the repeater setting.
  twitchAPIData.value.featuredChannels.length = 0;
}

/**
 * Logs out of the Twitch integration.
 */
async function logout(): Promise<void> {
  if (twitchAPIData.value.state === 'off') {
    throw new Error('Integration not ready');
  }
  twitchAPIData.value = { state: 'off', sync: false, featuredChannels: [] };
  twitchChannelInfo.value = {};
  clearTimeout(channelInfoTO);
  nodecg.log.info('[Twitch] Integration successfully logged out');
}

/**
 * Validate the currently stored token against the Twitch API.
 */
async function validateToken(): Promise<{
  client_id: string; // eslint-disable-line camelcase
  login: string;
  scopes: string[];
  user_id: string; // eslint-disable-line camelcase
}> {
  const resp = await needle(
    'get',
    'https://id.twitch.tv/oauth2/validate',
    null,
    {
      headers: {
        Authorization: `OAuth ${twitchAPIData.value.accessToken}`,
      },
    },
  );
  if (resp.statusCode !== 200) {
    throw new Error(JSON.stringify(resp.body));
    // Do we need to retry here?
  }
  return resp.body;
}

/**
 * Refreshes the Twitch API access token, called whenever that is needed.
 */
export async function refreshToken(): Promise<void> {
  try {
    nodecg.log.info('[Twitch] Attempting to refresh access token');
    const resp = await needle(
      'post',
      'https://id.twitch.tv/oauth2/token',
      {
        grant_type: 'refresh_token',
        refresh_token: encodeURI(twitchAPIData.value.refreshToken as string),
        client_id: config.twitch.clientID,
        client_secret: config.twitch.clientSecret,
      },
    );
    if (resp.statusCode !== 200) {
      throw new Error(JSON.stringify(resp.body));
      // Do we need to retry here?
    }
    nodecg.log.info('[Twitch] Successfully refreshed access token');
    twitchAPIData.value.accessToken = resp.body.access_token;
    twitchAPIData.value.refreshToken = resp.body.refresh_token;
  } catch (err) {
    nodecg.log.warn('[Twitch] Error refreshing access token, you need to relogin');
    nodecg.log.debug('[Twitch] Error refreshing access token:', err);
    await to(logout());
    throw err;
  }
}

/**
 * Make a request to Twitch API.
 */
// eslint-disable-next-line max-len
async function request(method: NeedleHttpVerbs, endpoint: string, data: BodyData = null, newAPI = false): Promise<NeedleResponse> {
  const ep = `/${newAPI ? 'helix' : 'kraken'}${endpoint}`;
  try {
    nodecg.log.debug(`[Twitch] API ${method.toUpperCase()} request processing on ${ep}`);
    let retry = false;
    let attempts = 0;
    let resp;
    do {
      retry = false;
      attempts += 1;
      resp = await needle(
        method,
        `https://api.twitch.tv${ep}`,
        data,
        {
          headers: {
            Accept: !newAPI ? 'application/vnd.twitchtv.v5+json' : '',
            'Content-Type': 'application/json',
            Authorization: `${newAPI ? 'Bearer' : 'OAuth'} ${twitchAPIData.value.accessToken}`,
            'Client-ID': config.twitch.clientID,
          },
        },
      );
      if (resp.statusCode === 401 && attempts <= 1) {
        nodecg.log.debug(
          `[Twitch] API ${method.toUpperCase()} request `
          + `resulted in ${resp.statusCode} on ${ep}:`,
          JSON.stringify(resp.body),
        );
        await refreshToken();
        retry = true;
        // Can a 401 mean something else?
      } else if (![200, 204].includes(resp.statusCode as number)) {
        throw new Error(JSON.stringify(resp.body));
        // Do we need to retry here?
      }
    } while (retry);
    nodecg.log.debug(`[Twitch] API ${method.toUpperCase()} request successful on ${ep}`);
    return resp;
  } catch (err) {
    nodecg.log.debug(`[Twitch] API ${method.toUpperCase()} request error on ${ep}:`, err);
    throw err;
  }
}

/**
 * Gets the channel's information and stores it in a replicant every 60 seconds.
 */
async function refreshChannelInfo(): Promise<void> {
  try {
    const resp = await request(
      'get',
      `/channels?broadcaster_id=${twitchAPIData.value.channelID}`,
      null,
      true,
    );
    if (resp.statusCode !== 200) {
      throw new Error(JSON.stringify(resp.body));
    }
    if (!resp.body.data.length) {
      throw new Error('channel with specified ID could not be found');
    }
    [twitchChannelInfo.value] = resp.body.data;
    channelInfoTO = setTimeout(refreshChannelInfo, 60 * 1000);
  } catch (err) {
    // Try again after 10 seconds.
    nodecg.log.warn('[Twitch] Error getting channel information');
    nodecg.log.debug('[Twitch] Error getting channel information:', err);
    channelInfoTO = setTimeout(refreshChannelInfo, 10 * 1000);
  }
}

// TODO: Add delay to this?
/**
 * Returns the correct name of a game in the Twitch directory based on a search.
 * @param query String you wish to try to find a game with.
 */
async function searchForGame(query: string): Promise<{ id: string, name: string }> {
  if (twitchAPIData.value.state !== 'on') {
    throw new Error('Integration not ready');
  }
  const resp = await request(
    'get',
    `/search/categories?query=${encodeURIComponent(query)}`,
    null,
    true,
  );
  if (resp.statusCode !== 200) {
    throw new Error(JSON.stringify(resp.body));
  } else if (!resp.body.data || !resp.body.data.length) {
    throw new Error(`No game matches for "${query}"`);
  }
  const results = resp.body.data as { id: string, name: string }[];
  const exact = results.find((game) => game.name.toLowerCase() === query.toLowerCase());
  return exact || results[0];
}

/**
 * Verify a Twitch directory exists and get the correct name if so.
 * Will return undefined if it cannot.
 * @param query String to use to find/verify the directory.
 */
export async function verifyTwitchDir(query: string): Promise<
{ id: string, name: string } | undefined> {
  const [, game] = await to(searchForGame(query));
  return game;
}

/**
 * Attempts to update the title/game on the set channel.
 * @param status Title to set.
 * @param game Game to set.
 */
export async function updateChannelInfo(title?: string, game?: string): Promise<boolean> {
  if (twitchAPIData.value.state !== 'on') {
    throw new Error('Integration not ready');
  }
  try {
    nodecg.log.info('[Twitch] Attempting to update channel information');
    let noTwitchGame = false;
    let [, dir] = (game) ? await to(verifyTwitchDir(game)) : [null, undefined];
    if (!dir && game) {
      // If no category found, find entry for default category.
      noTwitchGame = true;
      [, dir] = await to(verifyTwitchDir(bundleConfig().twitch.streamDefaultGame));
    }
    const resp = await request(
      'patch',
      `/channels?broadcaster_id=${twitchAPIData.value.channelID}`,
      {
        title: title?.slice(0, 140),
        game_id: dir?.id || '',
      },
      true,
    );
    if (resp.statusCode !== 204) {
      throw new Error(JSON.stringify(resp.body));
    }
    nodecg.log.info('[Twitch] Successfully updated channel information');
    // "New" API doesn't return anything so update the data with what we've got.
    twitchChannelInfo.value.title = title?.slice(0, 140) || '';
    twitchChannelInfo.value.game_id = dir?.id || '';
    twitchChannelInfo.value.game_name = dir?.name || '';
    return noTwitchGame;
  } catch (err) {
    nodecg.log.warn('[Twitch] Error updating channel information');
    nodecg.log.debug('[Twitch] Error updating channel information:', err);
    throw err;
  }
}

/**
 * Triggered when a commercial is started, and runs every second
 * until it has assumed to have ended, to update the relevant replicant.
 * We also do this during setup, in case there was one running when the app closed.
 */
function updateCommercialTimer(): void {
  const timer = twitchCommercialTimer.value;
  const remaining = timer.originalDuration - ((Date.now() - timer.timestamp) / 1000);
  if (remaining > 0) {
    twitchCommercialTimer.value.secondsRemaining = Math.round(remaining);
    setTimeout(updateCommercialTimer, 1000);
  } else {
    twitchCommercialTimer.value.secondsRemaining = 0;
  }
}

/**
 * Update commercial timer values, trigger check logic.
 */
function startCommercialTimer(dur: number): void {
  if (twitchCommercialTimer.value.secondsRemaining > 0) {
    throw new Error('Commercial timer already running');
  }
  twitchCommercialTimer.value.originalDuration = dur;
  twitchCommercialTimer.value.secondsRemaining = dur;
  twitchCommercialTimer.value.timestamp = Date.now();
  updateCommercialTimer();
}

/**
 * Attempts to start a commercial on the set channel.
 */
async function startCommercial(duration?: CommercialDuration):
Promise<{ duration: CommercialDuration }> {
  if (twitchAPIData.value.state !== 'on') {
    throw new Error('Integration not ready');
  }
  if (twitchCommercialTimer.value.secondsRemaining > 0) {
    throw new Error('Commercial already running');
  }
  nodecg.log.info('[Twitch] Requested a commercial to be started');
  const dur = duration && typeof duration === 'number' ? duration : 180;

  try {
    if (!config.twitch.commercialsUseExternal) {
      const resp = await request(
        'post',
        '/channels/commercial',
        {
          broadcaster_id: twitchAPIData.value.channelID,
          length: dur,
        },
        true,
      );
      if (resp.statusCode !== 200) {
        throw new Error(JSON.stringify(resp.body));
      }
    } else { // Send out message for external code to listen to.
      to(events.sendMessage('twitchExternalCommercial', { duration: dur }));
      nodecg.sendMessage('twitchExternalCommercial', { duration: dur });
      nodecg.log.info('[Twitch] Commercial request being sent to external script');
      // Currently we assume it worked and don't get a confirmation.
    }

    startCommercialTimer(dur);
    nodecg.log.info(`[Twitch] Commercial started successfully (${dur} seconds)`);
    nodecg.sendMessage('twitchCommercialStarted', { duration: dur });
    nodecg.sendMessage('twitchAdStarted', { duration: dur }); // Legacy
    to(events.sendMessage('twitchCommercialStarted', { duration: dur }));
    return { duration: dur };
  } catch (err) {
    nodecg.log.warn('[Twitch] Error starting commercial');
    nodecg.log.debug('[Twitch] Error starting commercial:', err);
    throw err;
  }
}

/**
 * Setup done on both server boot (if token available) and initial auth flow.
 */
async function setUp(): Promise<void> {
  let userResp: NeedleResponse | undefined;
  if (!config.twitch.channelName) {
    let [err, resp] = await to(validateToken());
    if (err) {
      await refreshToken();
      [err, resp] = await to(validateToken());
    }
    if (!resp) {
      throw new Error('No response while validating token');
    }
    twitchAPIData.value.channelID = resp.user_id;
    twitchAPIData.value.channelName = resp.login;
    userResp = await request('get', `/users?id=${resp.user_id}`, null, true);
  } else {
    userResp = await request('get', `/users?login=${config.twitch.channelName}`, null, true);
    if (!userResp.body.data.length) {
      throw new Error('channelName specified in the configuration not found');
    }
    twitchAPIData.value.channelID = userResp.body.data[0].id;
    twitchAPIData.value.channelName = userResp.body.data[0].login;
  }
  clearTimeout(channelInfoTO);
  twitchAPIData.value.state = 'on';
  twitchAPIData.value.broadcasterType = userResp.body.data[0]?.broadcaster_type;
  refreshChannelInfo();
  updateCommercialTimer();
}

if (config.twitch.enabled) {
  nodecg.log.info('[Twitch] Integration enabled');

  // Listen for logout command from button on dashboard.
  nodecg.listenFor('twitchLogout', (data, ack) => {
    logout()
      .then(() => processAck(ack, null))
      .catch((err) => processAck(ack, err));
  });

  // If we already have an access token stored, verify it.
  if (twitchAPIData.value.accessToken) {
    twitchAPIData.value.state = 'authenticating';
    setUp().then(() => {
      nodecg.log.info('[Twitch] Integration ready');
    }).catch((err) => {
      nodecg.log.warn('[Twitch] Issue activating integration: ', err);
      to(logout());
    });
  }

  // Route that receives Twitch's auth code when the user does the flow from the dashboard.
  app.get('/nodecg-speedcontrol/twitchauth', (req, res) => {
    twitchAPIData.value.state = 'authenticating';
    needle(
      'post',
      'https://id.twitch.tv/oauth2/token',
      { /* eslint-disable @typescript-eslint/naming-convention */
        client_id: config.twitch.clientID,
        client_secret: config.twitch.clientSecret,
        code: req.query.code,
        grant_type: 'authorization_code',
        redirect_uri: config.twitch.redirectURI,
      }, /* eslint-enable */
    ).then((resp) => {
      twitchAPIData.value.accessToken = resp.body.access_token;
      twitchAPIData.value.refreshToken = resp.body.refresh_token;
      setUp().then(() => {
        nodecg.log.info('[Twitch] Authentication successful');
        res.send('<b>Twitch authentication is now complete, '
                + 'feel free to close this window/tab.</b>');
      }).catch(() => {
        throw new Error();
      });
    }).catch(() => {
      nodecg.log.warn('[Twitch] Issue with authentication');
      to(logout());
      res.send('<b>Error while processing the Twitch authentication, please try again.</b>');
    });
  });

  nodecg.mount(app);
}

// NodeCG messaging system.
nodecg.listenFor('twitchUpdateChannelInfo', (data, ack) => {
  updateChannelInfo(data.status, data.game)
    .then((noTwitchGame) => processAck(ack, null, noTwitchGame))
    .catch((err) => processAck(ack, err));
});
nodecg.listenFor('twitchStartCommercial', (data, ack) => {
  startCommercial(data.duration)
    .then(() => processAck(ack, null))
    .catch((err) => processAck(ack, err));
});
nodecg.listenFor('playTwitchAd', (data, ack) => { // Legacy
  startCommercial(data.duration)
    .then(() => processAck(ack, null))
    .catch((err) => processAck(ack, err));
});
nodecg.listenFor('twitchStartCommercialTimer', (data, ack) => {
  try {
    startCommercialTimer(data.duration);
    processAck(ack, null);
  } catch (err) {
    processAck(ack, err);
  }
});
nodecg.listenFor('twitchAPIRequest', (data, ack) => {
  request(data.method, data.endpoint, data.data, data.newAPI)
    .then((resp) => processAck(ack, null, resp))
    .catch((err) => processAck(ack, err));
});

// Our messaging system.
events.listenFor('twitchUpdateChannelInfo', (data, ack) => {
  updateChannelInfo(data.status, data.game)
    .then((noTwitchGame) => {
      processAck(ack, null, noTwitchGame);
      if (noTwitchGame) {
        nodecg.sendMessage('triggerAlert', 'NoTwitchGame');
      }
    })
    .catch((err) => processAck(ack, err));
});
events.listenFor('twitchStartCommercial', (data, ack) => {
  startCommercial(data.duration)
    .then(() => processAck(ack, null))
    .catch((err) => processAck(ack, err));
});
events.listenFor('twitchStartCommercialTimer', (data, ack) => {
  try {
    startCommercialTimer(data.duration);
    processAck(ack, null);
  } catch (err) {
    processAck(ack, err);
  }
});
events.listenFor('twitchAPIRequest', (data, ack) => {
  request(data.method, data.endpoint, data.data, data.newAPI)
    .then((resp) => processAck(ack, null, resp))
    .catch((err) => processAck(ack, err));
});
