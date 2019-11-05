import express from 'express';
import needle, { BodyData, NeedleHttpVerbs, NeedleResponse } from 'needle';
import { TwitchAPIData, TwitchChannelInfo } from '../../schemas';
import * as events from './util/events';
import { bundleConfig, processAck, to } from './util/helpers';
import { get } from './util/nodecg';

const nodecg = get();
const config = bundleConfig();
const app = express();
const apiData = nodecg.Replicant<TwitchAPIData>('twitchAPIData');
const channelInfo = nodecg.Replicant<TwitchChannelInfo>('twitchChannelInfo');
let channelInfoTO: NodeJS.Timeout;

apiData.value.state = 'off'; // Set this to "off" on every start.
apiData.value.featuredChannels.length = 0; // Empty on every start.

/**
 * Logs out of the Twitch integration.
 */
async function logout(): Promise<void> {
  if (apiData.value.state === 'off') {
    throw new Error('Integration not ready');
  }
  apiData.value = { state: 'off', sync: false, featuredChannels: [] };
  channelInfo.value = {};
  clearTimeout(channelInfoTO);
  nodecg.log.info('[Twitch] Integration successfully logged out');
}

/**
 * Validate the currently stored token against the Twitch ID API.
 */
async function validateToken(): Promise<{
  client_id: string;
  login: string;
  scopes: string[];
  user_id: string;
}> {
  const resp = await needle(
    'get',
    'https://id.twitch.tv/oauth2/validate',
    {},
    {
      headers: {
        Authorization: `OAuth ${apiData.value.accessToken}`,
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
      { /* eslint-disable @typescript-eslint/camelcase */
        grant_type: 'refresh_token',
        refresh_token: encodeURI(apiData.value.refreshToken as string),
        client_id: config.twitch.clientID,
        client_secret: config.twitch.clientSecret,
      }, /* eslint-enable */
    );
    if (resp.statusCode !== 200) {
      throw new Error(JSON.stringify(resp.body));
      // Do we need to retry here?
    }
    nodecg.log.info('[Twitch] Successfully refreshed access token');
    apiData.value.accessToken = resp.body.access_token;
    apiData.value.refreshToken = resp.body.refresh_token;
  } catch (err) {
    nodecg.log.warn('[Twitch] Error refreshing access token, you need to relogin');
    nodecg.log.debug('[Twitch] Error refreshing access token:', err);
    await to(logout());
    throw err;
  }
}

/**
 * Make a request to Twitch API v5.
 * @param url Twitch API v5 endpoint you want to access.
 */
async function request(
  method: NeedleHttpVerbs, endpoint: string, data: BodyData = null,
): Promise<NeedleResponse> {
  try {
    nodecg.log.debug(`[Twitch] API ${method.toUpperCase()} request processing on ${endpoint}`);
    let retry = false;
    let attempts = 0;
    let resp;
    do {
      retry = false;
      attempts += 1;
      // eslint-disable-next-line no-await-in-loop
      resp = await needle(
        method,
        `https://api.twitch.tv/kraken${endpoint}`,
        data,
        {
          headers: {
            Accept: 'application/vnd.twitchtv.v5+json',
            'Content-Type': 'application/json',
            Authorization: `OAuth ${apiData.value.accessToken}`,
            'Client-ID': config.twitch.clientID,
          },
        },
      );
      if (resp.statusCode === 401 && attempts <= 1) {
        nodecg.log.debug(
          `[Twitch] API ${method.toUpperCase()} request `
          + `resulted in ${resp.statusCode} on ${endpoint}:`,
          JSON.stringify(resp.body),
        );
        await refreshToken(); // eslint-disable-line no-await-in-loop
        retry = true;
        // Can a 401 mean something else?
      } else if (resp.statusCode !== 200) {
        throw new Error(JSON.stringify(resp.body));
        // Do we need to retry here?
      }
    } while (retry);
    nodecg.log.debug(`[Twitch] API ${method.toUpperCase()} request successful on ${endpoint}`);
    return resp;
  } catch (err) {
    nodecg.log.debug(`[Twitch] API ${method.toUpperCase()} request error on ${endpoint}:`, err);
    throw err;
  }
}

/**
 * Gets the channel's information and stores it in a replicant every 60 seconds.
 */
async function refreshChannelInfo(): Promise<void> {
  try {
    const resp = await request('get', `/channels/${apiData.value.channelID}`);
    if (resp.statusCode !== 200) {
      throw new Error(JSON.stringify(resp.body));
    }
    channelInfo.value = resp.body;
    channelInfoTO = setTimeout(refreshChannelInfo, 60 * 1000);
  } catch (err) {
    // Try again after 10 seconds.
    nodecg.log.warn('[Twitch] Error getting channel information');
    nodecg.log.debug('[Twitch] Error getting channel information:', err);
    channelInfoTO = setTimeout(refreshChannelInfo, 10 * 1000);
  }
}

/**
 * Returns the correct name of a game in the Twitch directory based on a search.
 * @param query String you wish to try to find a game with.
 */
async function searchForGame(query: string): Promise<string> {
  if (apiData.value.state !== 'on') {
    throw new Error('Integration not ready');
  }
  const resp = await request('get', `/search/games?query=${encodeURI(query)}`);
  if (resp.statusCode !== 200) {
    throw new Error(JSON.stringify(resp.body));
  } else if (!resp.body.games || !resp.body.games.length) {
    throw new Error(`No game matches for "${query}"`);
  }
  const results = resp.body.games as { name: string }[];
  const exact = results.find((game) => game.name.toLowerCase() === query.toLowerCase());
  return (exact) ? exact.name : results[0].name;
}

/**
 * Verify a Twitch directory exists and get the correct name if so.
 * Will return undefined if it cannot.
 * @param query String to use to find/verify the directory.
 */
export async function verifyTwitchDir(query: string): Promise<string | undefined> {
  const [, game] = await to(searchForGame(query));
  return game;
}

/**
 * Attempts to update the title/game on the set channel.
 * @param status Title to set.
 * @param game Game to set.
 */
export async function updateChannelInfo(status: string, game: string): Promise<boolean> {
  if (apiData.value.state !== 'on') {
    throw new Error('Integration not ready');
  }
  try {
    nodecg.log.info('[Twitch] Attempting to update channel information');
    const [, dir] = await to(verifyTwitchDir(game));
    const resp = await request(
      'put',
      `/channels/${apiData.value.channelID}`,
      {
        channel: {
          status: status.slice(0, 140),
          game: dir || bundleConfig().twitch.streamDefaultGame,
        },
      },
    );
    if (resp.statusCode !== 200) {
      throw new Error(JSON.stringify(resp.body));
    }
    nodecg.log.info('[Twitch] Successfully updated channel information');
    channelInfo.value = resp.body;
    return !dir;
  } catch (err) {
    nodecg.log.warn('[Twitch] Error updating channel information');
    nodecg.log.debug('[Twitch] Error updating channel information:', err);
    throw err;
  }
}

/**
 * Attempts to start a commercial on the set channel.
 */
async function startCommercial(): Promise<{ duration: number }> {
  if (apiData.value.state !== 'on') {
    throw new Error('Integration not ready');
  }
  try {
    nodecg.log.info('[Twitch] Requested a commercial to be started');
    const resp = await request(
      'post',
      `/channels/${apiData.value.channelID}/commercial`,
      {
        duration: 180,
      },
    );
    if (resp.statusCode !== 200) {
      throw new Error(JSON.stringify(resp.body));
    }
    nodecg.log.info('[Twitch] Commercial started successfully');
    nodecg.sendMessage('twitchCommercialStarted', { duration: 180 });
    nodecg.sendMessage('twitchAdStarted', { duration: 180 }); // Legacy
    to(events.sendMessage('twitchCommercialStarted', { duration: 180 }));
    return { duration: 180 };
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
  if (!config.twitch.channelName) {
    let [err, resp] = await to(validateToken());
    if (err) {
      await refreshToken();
      [err, resp] = await to(validateToken());
    }
    if (!resp) {
      throw new Error('No response while validating token');
    }
    apiData.value.channelID = resp.user_id;
    apiData.value.channelName = resp.login;
  } else {
    const resp = await request('get', `/users?login=${config.twitch.channelName}`);
    if (!resp.body.users.length) {
      throw new Error('channelName specified in the configuration not found');
    }
    apiData.value.channelID = resp.body.users[0]._id; // eslint-disable-line no-underscore-dangle
    apiData.value.channelName = resp.body.users[0].name;
  }
  clearTimeout(channelInfoTO);
  apiData.value.state = 'on';
  refreshChannelInfo();
}

if (config.twitch.enabled) {
  nodecg.log.info('[Twitch] Integration enabled');

  // NodeCG messaging system.
  nodecg.listenFor('twitchUpdateChannelInfo', (data, ack) => {
    updateChannelInfo(data.status, data.game)
      .then((noTwitchGame) => processAck(ack, null, noTwitchGame))
      .catch((err) => processAck(ack, err));
  });
  nodecg.listenFor('twitchStartCommercial', (data, ack) => {
    startCommercial()
      .then(() => processAck(ack, null))
      .catch((err) => processAck(ack, err));
  });
  nodecg.listenFor('playTwitchAd', (data, ack) => { // Legacy
    startCommercial()
      .then(() => processAck(ack, null))
      .catch((err) => processAck(ack, err));
  });
  nodecg.listenFor('twitchLogout', (data, ack) => {
    logout()
      .then(() => processAck(ack, null))
      .catch((err) => processAck(ack, err));
  });

  // If we already have an access token stored, verify it.
  if (apiData.value.accessToken) {
    apiData.value.state = 'authenticating';
    setUp().then(() => {
      nodecg.log.info('[Twitch] Integration ready');
    }).catch((err) => {
      nodecg.log.warn('[Twitch] Issue activating integration: ', err);
      to(logout());
    });
  }

  // Route that receives Twitch's auth code when the user does the flow from the dashboard.
  app.get('/nodecg-speedcontrol/twitchauth', (req, res) => {
    apiData.value.state = 'authenticating';
    needle(
      'post',
      'https://id.twitch.tv/oauth2/token',
      { /* eslint-disable @typescript-eslint/camelcase */
        client_id: config.twitch.clientID,
        client_secret: config.twitch.clientSecret,
        code: req.query.code,
        grant_type: 'authorization_code',
        redirect_uri: config.twitch.redirectURI,
      }, /* eslint-enable */
    ).then((resp) => {
      apiData.value.accessToken = resp.body.access_token;
      apiData.value.refreshToken = resp.body.refresh_token;
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
