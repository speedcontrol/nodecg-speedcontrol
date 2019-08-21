import needle, { NeedleResponse } from 'needle';
import { NodeCG } from 'nodecg/types/server'; // eslint-disable-line
import * as events from './util/events';

export default class SRComAPI {
  private nodecg: NodeCG;

  constructor(nodecg: NodeCG) {
    this.nodecg = nodecg;

    // Our messaging system.
    events.listenFor('srcomTwitchGameSearch', (data, ack): void => {
      this.searchForTwitchGame(data)
        .then((data_): void => { ack(null, data_); })
        .catch((err): void => { ack(err); });
    });
  }

  /**
   * Make a GET request to speedrun.com API.
   * @param url speedrun.com API endpoint you want to access.
   */
  get(endpoint: string): Promise<NeedleResponse> {
    return new Promise(async (resolve, reject): Promise<void> => {
      try {
        this.nodecg.log.debug(`speedrun.com API request processing on ${endpoint}.`);
        // eslint-disable-next-line
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
        if (resp.statusCode !== 200) {
          throw new Error(JSON.stringify(resp.body));
          // Do we need to retry here?
        }
        this.nodecg.log.debug(`speedrun.com API request successful on ${endpoint}.`);
        resolve(resp);
      } catch (err) {
        this.nodecg.log.debug(`speedrun.com API request error on ${endpoint}:`, err);
        reject(err);
      }
    });
  }

  /**
   * Returns the Twitch game name if set on speedrun.com.
   * @param query String you wish to try to find a game with.
   */
  searchForTwitchGame(query: string): Promise<string> {
    return new Promise(async (resolve, reject): Promise<void> => {
      try {
        const resp = await this.get(
          `/games?name=${encodeURI(query)}&max=1`,
        );
        if (resp.statusCode !== 200) {
          throw new Error(JSON.stringify(resp.body));
        } else if (!resp.body.data.length) {
          throw new Error(`No game matches on speedrun.com for "${query}"`);
        } else if (!resp.body.data[0].names.twitch) {
          throw new Error(`No Twitch game name found on speedrun.com for "${query}"`);
        }
        resolve(resp.body.data[0].names.twitch);
      } catch (err) {
        reject(err);
      }
    });
  }
}
