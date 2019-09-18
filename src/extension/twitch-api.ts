import express from 'express';
import needle, { BodyData, NeedleHttpVerbs, NeedleResponse } from 'needle';
import { NodeCG, Replicant } from 'nodecg/types/server'; // eslint-disable-line
import { Configschema } from '../../configschema';
import { TwitchAPIData, TwitchChannelInfo } from '../../schemas';
import * as events from './util/events';
import Helpers from './util/helpers';

const { processAck, to } = Helpers;

export default class TwitchAPI {
  /* eslint-disable lines-between-class-members */
  private h: Helpers;
  private config: Configschema;
  private data: Replicant<TwitchAPIData>
  private channelInfo: Replicant<TwitchChannelInfo>
  private channelInfoTO: NodeJS.Timeout | undefined;
  /* eslint-enable lines-between-class-members */

  constructor(nodecg: NodeCG) {
    this.h = new Helpers(nodecg);
    this.config = this.h.bundleConfig();
    this.data = nodecg.Replicant('twitchAPIData');
    this.channelInfo = nodecg.Replicant('twitchChannelInfo');
    const app = express();
    this.data.value.state = 'off'; // Set this to "off" on every start.
    this.data.value.featuredChannels.length = 0; // Empty on every start.

    if (this.config.twitch.enabled) {
      nodecg.log.info('[Twitch] Integration enabled.');

      // NodeCG messaging system.
      nodecg.listenFor('twitchUpdateChannelInfo', (data, ack) => {
        this.updateChannelInfo(data.status, data.game)
          .then(() => processAck(null, ack))
          .catch((err) => processAck(err, ack));
      });
      nodecg.listenFor('twitchStartCommercial', (data, ack) => {
        this.startCommercial()
          .then(() => processAck(null, ack))
          .catch((err) => processAck(err, ack));
      });
      nodecg.listenFor('playTwitchAd', (data, ack) => { // Legacy
        this.startCommercial()
          .then(() => processAck(null, ack))
          .catch((err) => processAck(err, ack));
      });
      nodecg.listenFor('twitchLogout', (data, ack) => {
        this.logout()
          .then(() => processAck(null, ack))
          .catch((err) => processAck(err, ack));
      });

      // Our messaging system.
      events.listenFor('twitchUpdateChannelInfo', (data, ack) => {
        this.updateChannelInfo(data.status, data.game)
          .then(() => ack(null))
          .catch((err) => ack(err));
      });
      events.listenFor('twitchGameSearch', (data, ack) => {
        this.searchForGame(data)
          .then((data_) => ack(null, data_))
          .catch((err) => ack(err));
      });
      events.listenFor('twitchRefreshToken', (data, ack) => {
        this.refreshToken()
          .then(() => ack(null))
          .catch((err) => ack(err));
      });

      // If we already have an access token stored, verify it.
      if (this.data.value.accessToken) {
        this.data.value.state = 'authenticating';
        this.setUp().then(() => {
          nodecg.log.info('[Twitch] integration ready.');
        }).catch(() => {
          nodecg.log.warn('[Twitch] Issue activating integration.');
          to(this.logout());
        });
      }

      // Route that receives Twitch's auth code when the user does the flow from the dashboard.
      app.get('/nodecg-speedcontrol/twitchauth', (req, res) => {
        this.data.value.state = 'authenticating';
        needle(
          'post',
          'https://id.twitch.tv/oauth2/token',
          { /* eslint-disable @typescript-eslint/camelcase */
            client_id: this.config.twitch.clientID,
            client_secret: this.config.twitch.clientSecret,
            code: req.query.code,
            grant_type: 'authorization_code',
            redirect_uri: this.config.twitch.redirectURI,
          }, /* eslint-enable @typescript-eslint/camelcase */
        ).then((resp) => {
          this.data.value.accessToken = resp.body.access_token;
          this.data.value.refreshToken = resp.body.refresh_token;
          this.setUp().then(() => {
            nodecg.log.info('[Twitch] Authentication successful.');
            res.send('<b>Twitch authentication is now complete, feel free to close this window/tab.</b>');
          }).catch(() => {
            throw new Error();
          });
        }).catch(() => {
          nodecg.log.warn('[Twitch] Issue with authentication.');
          to(this.logout());
          res.send('<b>Error while processing the Twitch authentication, please try again.</b>');
        });
      });

      nodecg.mount(app);
    }
  }

  /**
   * Setup done on both server boot (if token available) and initial auth flow.
   */
  setUp(): Promise<void> {
    return new Promise(async (resolve, reject): Promise<void> => {
      try {
        if (!this.config.twitch.channelName) {
          let [err, resp] = await to(this.validateToken());
          if (err) {
            await this.refreshToken();
            [err, resp] = await to(this.validateToken());
          }
          this.data.value.channelID = resp.user_id;
          this.data.value.channelName = resp.login;
        } else {
          const resp = await this.request('get', `/users?login=${this.config.twitch.channelName}`);
          if (!resp.body.users.length) {
            throw new Error('channelName specified in the configuration not found.');
          }
          this.data.value.channelID = resp.body.users[0]._id; // eslint-disable-line
          this.data.value.channelName = resp.body.users[0].name;
        }

        global.clearTimeout(this.channelInfoTO as NodeJS.Timeout);
        this.data.value.state = 'on';
        this.refreshChannelInfo();
        resolve();
      } catch (err) {
        reject();
      }
    });
  }

  /**
   * Logs out of the Twitch integration.
   */
  logout(): Promise<void> {
    return new Promise((resolve): void => {
      if (this.data.value.state === 'off') {
        throw new Error('Integration not ready.');
      }
      this.data.value = { state: 'off', sync: false, featuredChannels: [] };
      this.channelInfo.value = {};
      global.clearTimeout(this.channelInfoTO as NodeJS.Timeout);
      this.h.nodecg.log.info('[Twitch] Integration successfully logged out.');
      resolve();
    });
  }

  /**
   * Validate the currently stored token against the Twitch ID API.
   */
  validateToken(): Promise<{
    client_id: string;
    login: string;
    scopes: string[];
    user_id: string;
  }> {
    return new Promise(async (resolve, reject): Promise<void> => {
      try {
        const resp = await needle(
          'get',
          'https://id.twitch.tv/oauth2/validate',
          {},
          {
            headers: {
              Authorization: `OAuth ${this.data.value.accessToken}`,
            },
          },
        );
        if (resp.statusCode !== 200) {
          throw new Error(JSON.stringify(resp.body));
          // Do we need to retry here?
        }
        resolve(resp.body);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Make a request to Twitch API v5.
   * @param url Twitch API v5 endpoint you want to access.
   */
  request(
    method: NeedleHttpVerbs, endpoint: string, data: BodyData = null,
  ): Promise<NeedleResponse> {
    return new Promise(async (resolve, reject): Promise<void> => {
      try {
        this.h.nodecg.log.debug(`[Twitch] API ${method.toUpperCase()} request processing on ${endpoint}.`);
        let retry = false;
        let attempts = 0;
        let resp;
        do {
          retry = false;
          attempts += 1;
          // eslint-disable-next-line
          resp = await needle(
            method,
            `https://api.twitch.tv/kraken${endpoint}`,
            data,
            {
              headers: {
                Accept: 'application/vnd.twitchtv.v5+json',
                'Content-Type': 'application/json',
                Authorization: `OAuth ${this.data.value.accessToken}`,
                'Client-ID': this.h.bundleConfig().twitch.clientID,
              },
            },
          );
          if (resp.statusCode === 401 && attempts <= 1) {
            this.h.nodecg.log.debug(
              `[Twitch] API ${method.toUpperCase()} request resulted in ${resp.statusCode} on ${endpoint}:`,
              JSON.stringify(resp.body),
            );
            await this.refreshToken(); // eslint-disable-line
            retry = true;
            // Can a 401 mean something else?
          } else if (resp.statusCode !== 200) {
            throw new Error(JSON.stringify(resp.body));
            // Do we need to retry here?
          }
        } while (retry);
        this.h.nodecg.log.debug(`[Twitch] API ${method.toUpperCase()} request successful on ${endpoint}.`);
        resolve(resp);
      } catch (err) {
        this.h.nodecg.log.debug(`[Twitch] API ${method.toUpperCase()} request error on ${endpoint}:`, err);
        reject(err);
      }
    });
  }

  /**
   * Refreshes the Twitch API access token, called whenever that is needed.
   */
  refreshToken(): Promise<void> {
    return new Promise(async (resolve, reject): Promise<void> => {
      try {
        this.h.nodecg.log.info('[Twitch] Attempting to refresh access token.');
        const resp = await needle(
          'post',
          'https://id.twitch.tv/oauth2/token',
          { /* eslint-disable */
            grant_type: 'refresh_token',
            refresh_token: encodeURI(this.data.value.refreshToken as string),
            client_id: this.config.twitch.clientID,
            client_secret: this.config.twitch.clientSecret,
          }, /* eslint-enable */
        );
        if (resp.statusCode !== 200) {
          throw new Error(JSON.stringify(resp.body));
          // Do we need to retry here?
        }
        this.h.nodecg.log.info('[Twitch] Successfully refreshed access token.');
        this.data.value.accessToken = resp.body.access_token;
        this.data.value.refreshToken = resp.body.refresh_token;
        resolve();
      } catch (err) {
        this.h.nodecg.log.warn('[Twitch] Error refreshing access token, you need to relogin.');
        await to(this.logout());
        reject(err);
      }
    });
  }

  /**
   * Gets the channel's information and stores it in a replicant every 60 seconds.
   */
  async refreshChannelInfo(): Promise<void> {
    try {
      const resp = await this.request('get', `/channels/${this.data.value.channelID}`);
      if (resp.statusCode !== 200) {
        throw new Error(JSON.stringify(resp.body));
      }
      this.channelInfo.value = resp.body;
      this.channelInfoTO = global.setTimeout(
        (): Promise<void> => this.refreshChannelInfo(),
        60 * 1000,
      );
    } catch (err) {
      // Try again after 10 seconds.
      this.h.nodecg.log.warn('[Twitch] Error getting channel information.');
      this.h.nodecg.log.debug('[Twitch] Error getting channel information:', err.message);
      this.channelInfoTO = global.setTimeout(
        (): Promise<void> => this.refreshChannelInfo(),
        10 * 1000,
      );
    }
  }

  /**
   * Attempts to update the title/game on the set channel.
   * @param status Title to set.
   * @param game Game to set.
   */
  updateChannelInfo(status: string, game: string): Promise<void> {
    return new Promise(async (resolve, reject): Promise<void> => {
      if (this.data.value.state !== 'on') {
        throw new Error('Integration not ready.');
      }
      try {
        this.h.nodecg.log.info('[Twitch] Attempting to update channel information.');
        const resp = await this.request(
          'put',
          `/channels/${this.data.value.channelID}`,
          {
            channel: {
              status,
              game,
            },
          },
        );
        if (resp.statusCode !== 200) {
          throw new Error(JSON.stringify(resp.body));
        }
        this.h.nodecg.log.info('[Twitch] Successfully updated channel information.');
        this.channelInfo.value = resp.body;
        resolve();
      } catch (err) {
        this.h.nodecg.log.warn('[Twitch] Error updating channel information.');
        this.h.nodecg.log.debug('[Twitch] Error updating channel information:', err.message);
        reject(err);
      }
    });
  }

  /**
   * Attempts to start a commercial on the set channel.
   */
  startCommercial(): Promise<{ duration: number }> {
    return new Promise(async (resolve, reject): Promise<void> => {
      if (this.data.value.state !== 'on') {
        throw new Error('Integration not ready.');
      }
      try {
        this.h.nodecg.log.info('[Twitch] Requested a commercial to be started.');
        const resp = await this.request(
          'post',
          `/channels/${this.data.value.channelID}/commercial`,
          {
            duration: 180,
          },
        );
        if (resp.statusCode !== 200) {
          throw new Error(JSON.stringify(resp.body));
        }
        this.h.nodecg.log.info('[Twitch] Commercial started successfully.');
        this.h.nodecg.sendMessage('twitchCommercialStarted', { duration: 180 });
        this.h.nodecg.sendMessage('twitchAdStarted', { duration: 180 }); // Legacy
        resolve({ duration: 180 });
      } catch (err) {
        this.h.nodecg.log.warn('[Twitch] Error starting commercial.');
        this.h.nodecg.log.debug('[Twitch] Error starting commercial:', err.message);
        reject(err);
      }
    });
  }

  /**
   * Returns the correct name of a game in the Twitch directory based on a search.
   * @param query String you wish to try to find a game with.
   */
  searchForGame(query: string): Promise<string> {
    return new Promise(async (resolve, reject): Promise<void> => {
      if (this.data.value.state !== 'on') {
        throw new Error('Integration not ready.');
      }
      try {
        const resp = await this.request(
          'get',
          `/search/games?query=${encodeURI(query)}`,
        );
        if (resp.statusCode !== 200) {
          throw new Error(JSON.stringify(resp.body));
        } else if (!resp.body.games || !resp.body.games.length) {
          throw new Error(`No game matches for "${query}".`);
        }
        resolve(resp.body.games[0].name);
      } catch (err) {
        reject(err);
      }
    });
  }
}
