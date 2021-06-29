import { UserData } from '@nodecg-speedcontrol/types';
import needle, { NeedleResponse } from 'needle';
import * as events from './util/events';
import { getTwitchUserFromURL, getTwitterUserFromURL, processAck, sleep } from './util/helpers';
import { get as ncgGet } from './util/nodecg';

const nodecg = ncgGet();
const userDataCache: { [k: string]: UserData } = {};

/**
 * Make a GET request to speedrun.com API.
 * @param url speedrun.com API endpoint you want to access.
 */
async function get(endpoint: string): Promise<NeedleResponse> {
  try {
    nodecg.log.debug(`[speedrun.com] API request processing on ${endpoint}`);
    const resp = await needle(
      'get',
      `https://www.speedrun.com/api/v1${endpoint}`,
      null,
      {
        headers: {
          'User-Agent': 'nodecg-speedcontrol',
          Accept: 'application/json',
        },
      },
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: parser exists but isn't in the typings
    if (resp.parser !== 'json') {
      throw new Error('Response was not JSON');
      // We should retry here.
    } else if (resp.statusCode !== 200) {
      throw new Error(JSON.stringify(resp.body));
      // Do we need to retry here? Depends on err code.
    }
    nodecg.log.debug(`[speedrun.com] API request successful on ${endpoint}`);
    return resp;
  } catch (err) {
    nodecg.log.debug(`[speedrun.com] API request error on ${endpoint}:`, err);
    throw err;
  }
}

/**
 * Returns the Twitch game name if set on speedrun.com.
 * @param query String you wish to try to find a game with.
 */
export async function searchForTwitchGame(query: string, abbr = false): Promise<string> {
  try {
    const endpoint = (abbr) ? 'abbreviation' : 'name';
    const resp = await get(`/games?${endpoint}=${encodeURIComponent(query)}&max=1`);
    if (!resp.body.data.length) {
      throw new Error('No game matches');
    } else if (!resp.body.data[0].names.twitch) {
      throw new Error('Game was found but has no Twitch game set');
    }
    nodecg.log.debug(
      `[speedrun.com] Twitch game name found for "${query}":`,
      resp.body.data[0].names.twitch,
    );
    return resp.body.data[0].names.twitch;
  } catch (err) {
    nodecg.log.debug(`[speedrun.com] Twitch game name lookup failed for "${query}":`, err);
    throw err;
  }
}

/**
 * Returns the user's data if available on speedrun.com.
 * @param query Query you wish to try to find a user with, with parameter type and query value.
 */
export async function searchForUserData(
  { type, val }: { type: 'name' | 'twitch' | 'twitter', val: string },
): Promise<UserData> {
  const cacheKey = `${type}_${val}`;
  if (userDataCache[cacheKey]) {
    nodecg.log.debug(
      `[speedrun.com] User data found in cache for "${type}/${val}":`,
      JSON.stringify(userDataCache[cacheKey]),
    );
    return userDataCache[cacheKey];
  }
  try {
    await sleep(1000);
    const resp = await get(
      `/users?${type}=${encodeURIComponent(val)}&max=10`,
    );
    const results = resp.body.data as UserData[];
    const exact = results.find((user) => {
      const exactToCheck = (() => {
        switch (type) {
          case 'name':
          default:
            return user.names.international;
          case 'twitch':
            return getTwitchUserFromURL(user.twitch?.uri);
          case 'twitter':
            return getTwitterUserFromURL(user.twitter?.uri);
        }
      })();
      return exactToCheck
        ? user.names.international.toLowerCase() === exactToCheck.toLowerCase()
        : undefined;
    });
    const data: UserData | undefined = exact || results[0];
    if (!data) {
      throw new Error(`No user matches for "${type}/${val}"`);
    }
    if (data.pronouns) {
      // Erase any pronouns that are custom strings that used to be allowed.
      const split = data.pronouns.split(',').map((p) => p.trim().toLowerCase());
      if (!split.includes('he/him') && !split.includes('she/her') && !split.includes('they/them')) {
        data.pronouns = '';
      }
    }
    userDataCache[cacheKey] = data; // Simple temp cache storage.
    nodecg.log.debug(
      `[speedrun.com] User data found for "${type}/${val}":`,
      JSON.stringify(resp.body.data[0]),
    );
    return resp.body.data[0];
  } catch (err) {
    nodecg.log.debug(`[speedrun.com] User data lookup failed for "${type}/${val}":`, err);
    throw err;
  }
}

/**
 * Try to find user data using multiple query types, will loop through them until one is successful.
 * Does not return any errors, if those happen this will just treat it as unsuccessful.
 * @param queries List of queries to use, if the val property in one is falsey it will be skipped.
 */
export async function searchForUserDataMultiple(
  ...queries: { type: 'name' | 'twitch' | 'twitter', val: (string | undefined | null) }[]
):
  Promise<UserData | undefined> {
  let userData;
  for (const query of queries) {
    if (query.val) {
      try {
        const { type, val } = query; // This is to help with Typing errors (for some reason).
        const data = await searchForUserData({ type, val });
        userData = data;
        break;
      } catch (err) {
        // nothing found
      }
    }
  }
  return userData;
}

// Our messaging system.
events.listenFor('srcomSearchForUserDataMultiple', async (data, ack) => {
  const resp = await searchForUserDataMultiple(...data);
  processAck(ack, null, resp);
});
