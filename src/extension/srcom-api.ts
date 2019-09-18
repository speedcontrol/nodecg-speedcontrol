import needle, { NeedleResponse } from 'needle';
import { NodeCG } from 'nodecg/types/server'; // eslint-disable-line
import { UserData } from '../../types';
import * as events from './util/events';

export default class SRComAPI {
  /* eslint-disable lines-between-class-members */
  private nodecg: NodeCG;
  private userDataCache: { [k: string]: UserData } = {};
  /* eslint-enable lines-between-class-members */

  constructor(nodecg: NodeCG) {
    this.nodecg = nodecg;

    // Our messaging system.
    events.listenFor('srcomTwitchGameSearch', (query, ack): void => {
      this.searchForTwitchGame(query)
        .then((data): void => { ack(null, data); })
        .catch((err): void => { ack(err); });
    });
    events.listenFor('srcomUserSearch', (query, ack): void => {
      this.searchForUserData(query)
        .then((data): void => { ack(null, data); })
        .catch((err): void => { ack(err); });
    });
  }

  /**
   * Make a GET request to speedrun.com API.
   * @param url speedrun.com API endpoint you want to access.
   */
  get(endpoint: string): Promise<NeedleResponse> {
    return new Promise((resolve, reject): void => {
      this.nodecg.log.debug(`[speedrun.com] API request processing on ${endpoint}.`);
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
          throw new Error('Response was not JSON.');
          // We should retry here.
        } else if (resp.statusCode !== 200) {
          throw new Error(JSON.stringify(resp.body));
          // Do we need to retry here? Depends on err code.
        }
        this.nodecg.log.debug(`[speedrun.com] API request successful on ${endpoint}.`);
        resolve(resp);
      }).catch((err) => {
        this.nodecg.log.debug(`[speedrun.com] API request error on ${endpoint}:`, err);
        reject(err);
      });
    });
  }

  /**
   * Returns the Twitch game name if set on speedrun.com.
   * @param query String you wish to try to find a game with.
   */
  searchForTwitchGame(query: string): Promise<string> {
    return new Promise((resolve, reject): void => {
      this.get(
        `/games?name=${encodeURI(query)}&max=1`,
      ).then((resp) => {
        if (!resp.body.data.length) {
          throw new Error('No game matches.');
        } else if (!resp.body.data[0].names.twitch) {
          throw new Error('Game was find but has no Twitch game set.');
        }
        this.nodecg.log.debug(
          `[speedrun.com] Twitch game name found for "${query}":`,
          resp.body.data[0].names.twitch,
        );
        resolve(resp.body.data[0].names.twitch);
      }).catch((err) => {
        this.nodecg.log.debug(`[speedrun.com] Twitch game name lookup failed for "${query}":`, err);
        reject(err);
      });
    });
  }

  /**
   * Returns the user's data if available on speedrun.com.
   * @param query String you wish to try to find a user with.
   */
  searchForUserData(query: string): Promise<UserData> {
    return new Promise((resolve, reject): void => {
      if (this.userDataCache[query]) {
        this.nodecg.log.debug(
          `[speedrun.com] User data found in cache for "${query}":`,
          JSON.stringify(this.userDataCache[query]),
        );
        resolve(this.userDataCache[query]);
        return;
      }
      this.get(
        `/users?lookup=${encodeURI(query)}&max=1`,
      ).then((resp) => {
        if (!resp.body.data.length) {
          throw new Error(`No user matches for "${query}".`);
        }
        [this.userDataCache[query]] = resp.body.data; // Simple temp cache storage.
        this.nodecg.log.debug(
          `[speedrun.com] User data found for "${query}":`,
          JSON.stringify(resp.body.data[0]),
        );
        resolve(resp.body.data[0]);
      }).catch((err) => {
        this.nodecg.log.debug(`[speedrun.com] User data lookup failed for "${query}":`, err);
        reject(err);
      });
    });
  }
}
