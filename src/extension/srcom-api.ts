import needle, { NeedleResponse } from 'needle';
import { UserData } from '../../types';
import * as events from './util/events';
import { get as getCtx } from './util/nodecg';

const nodecg = getCtx();

const userDataCache: { [k: string]: UserData } = {};

/**
 * Make a GET request to speedrun.com API.
 * @param url speedrun.com API endpoint you want to access.
 */
function get(endpoint: string): Promise<NeedleResponse> {
  return new Promise((resolve, reject): void => {
    nodecg.log.debug(`[speedrun.com] API request processing on ${endpoint}`);
    needle(
      'get',
      `https://www.speedrun.com/api/v1${endpoint}`,
      null,
      {
        headers: {
          'User-Agent': 'nodecg-speedcontrol',
          Accept: 'application/json',
        },
      },
    ).then((resp) => {
      // @ts-ignore: parser exists but isn't in the typings
      if (resp.parser !== 'json') {
        throw new Error('Response was not JSON');
        // We should retry here.
      } else if (resp.statusCode !== 200) {
        throw new Error(JSON.stringify(resp.body));
        // Do we need to retry here? Depends on err code.
      }
      nodecg.log.debug(`[speedrun.com] API request successful on ${endpoint}`);
      resolve(resp);
    }).catch((err) => {
      nodecg.log.debug(`[speedrun.com] API request error on ${endpoint}:`, err);
      reject(err);
    });
  });
}

/**
 * Returns the Twitch game name if set on speedrun.com.
 * @param query String you wish to try to find a game with.
 */
function searchForTwitchGame(query: string): Promise<string> {
  return new Promise((resolve, reject): void => {
    get(
      `/games?name=${encodeURI(query)}&max=1`,
    ).then((resp) => {
      if (!resp.body.data.length) {
        throw new Error('No game matches');
      } else if (!resp.body.data[0].names.twitch) {
        throw new Error('Game was find but has no Twitch game set');
      }
      nodecg.log.debug(
        `[speedrun.com] Twitch game name found for "${query}":`,
        resp.body.data[0].names.twitch,
      );
      resolve(resp.body.data[0].names.twitch);
    }).catch((err) => {
      nodecg.log.debug(`[speedrun.com] Twitch game name lookup failed for "${query}":`, err);
      reject(err);
    });
  });
}

/**
 * Returns the user's data if available on speedrun.com.
 * @param query String you wish to try to find a user with.
 */
function searchForUserData(query: string): Promise<UserData> {
  return new Promise((resolve, reject): void => {
    if (userDataCache[query]) {
      nodecg.log.debug(
        `[speedrun.com] User data found in cache for "${query}":`,
        JSON.stringify(userDataCache[query]),
      );
      resolve(userDataCache[query]);
      return;
    }
    get(
      `/users?lookup=${encodeURI(query)}&max=1`,
    ).then((resp) => {
      if (!resp.body.data.length) {
        throw new Error(`No user matches for "${query}"`);
      }
      [userDataCache[query]] = resp.body.data; // Simple temp cache storage.
      nodecg.log.debug(
        `[speedrun.com] User data found for "${query}":`,
        JSON.stringify(resp.body.data[0]),
      );
      resolve(resp.body.data[0]);
    }).catch((err) => {
      nodecg.log.debug(`[speedrun.com] User data lookup failed for "${query}":`, err);
      reject(err);
    });
  });
}

// Our messaging system.
events.listenFor('srcomTwitchGameSearch', (query, ack) => {
  searchForTwitchGame(query)
    .then((data) => ack(null, data))
    .catch((err) => ack(err));
});
events.listenFor('srcomUserSearch', (query, ack) => {
  searchForUserData(query)
    .then((data) => ack(null, data))
    .catch((err) => ack(err));
});
