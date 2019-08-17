import express from 'express';
import needle, { NeedleResponse } from 'needle';
import { NodeCG, Replicant } from 'nodecg/types/server'; // eslint-disable-line
import { Configschema } from '../../configschema';
import { TwitchAPIData, TwitchChannelData } from '../../schemas';
import Helpers from './util/helpers';

export default class TwitchAPI {
  /* eslint-disable */
  private nodecg: NodeCG;
  private h: Helpers;
  private config: Configschema;
  private data: Replicant<TwitchAPIData>
  private channelData: Replicant<TwitchChannelData>
  private channelDataTO: NodeJS.Timeout | undefined;
  /* eslint-enable */

  constructor(nodecg: NodeCG) {
    this.nodecg = nodecg;
    this.h = new Helpers(nodecg);
    this.config = this.h.bundleConfig();
    this.data = nodecg.Replicant('twitchAPIData');
    this.channelData = nodecg.Replicant('twitchChannelData');
    const app = express();
    this.data.value.ready = false; // Set this to false on every start.

    if (this.config.twitch.enabled) {
      nodecg.log.info('Twitch integration is enabled.');

      if (this.data.value.accessToken) {
        this.validateToken().then((): void => {
          this.data.value.ready = true;
          this.getChannelInfo();
          nodecg.log.info('Twitch integration is ready.');
        }).catch(async (): Promise<void> => {
          await this.refreshToken();
          this.data.value.ready = true;
          this.getChannelInfo();
          nodecg.log.info('Twitch integration is ready.');
        });
      }

      // Route that receives Twitch's auth code when the user does the flow from the dashboard.
      app.get('/nodecg-speedcontrol/twitchauth', async (req, res): Promise<void> => {
        try {
          const resp1 = await needle(
            'post',
            'https://id.twitch.tv/oauth2/token',
            { /* eslint-disable */
              client_id: this.config.twitch.clientID,
              client_secret: this.config.twitch.clientSecret,
              code: req.query.code,
              grant_type: 'authorization_code',
              redirect_uri: this.config.twitch.redirectURI,
            }, /* eslint-enable */
          );
          this.data.value.accessToken = resp1.body.access_token;
          this.data.value.refreshToken = resp1.body.refresh_token;

          const resp2 = await this.validateToken();
          this.data.value.channelID = resp2.user_id;
          this.data.value.channelName = resp2.login;
          this.data.value.ready = true;
          this.getChannelInfo();
          nodecg.log.info('Twitch integration is ready.');
          res.send('<b>Twitch authentication is now complete, feel free to close this window/tab.</b>');
        } catch (err) {
          res.send('<b>Error while processing the Twitch authentication, please try again.</b>');
        }
      });

      nodecg.mount(app);
    }
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
        if (resp.statusCode === 401) {
          throw new Error('401');
        } else if (resp.statusCode !== 200) {
          throw new Error(`${resp.statusCode}`);
          // we need to retry here at some point
        }
        resolve(resp.body);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Make a GET request to Twitch API v5.
   * @param url Twitch API v5 endpoint you want to access.
   */
  get(endpoint: string): Promise<NeedleResponse> {
    return new Promise(async (resolve, reject): Promise<void> => {
      try {
        let tokenValid = false;
        let resp;
        do {
          // eslint-disable-next-line
          resp = await needle(
            'get',
            `https://api.twitch.tv/kraken${endpoint}`,
            {},
            {
              headers: {
                Accept: 'application/vnd.twitchtv.v5+json',
                'Content-Type': 'application/json',
                Authorization: `OAuth ${this.data.value.accessToken}`,
              },
            },
          );
          if (resp.statusCode === 401) {
            await this.refreshToken(); // eslint-disable-line
            // sometimes a 401 could mean something else?
          } else if (resp.statusCode !== 200) {
            throw new Error(`${resp.statusCode}`);
            // we need to retry here at some point
          } else {
            tokenValid = true;
          }
        } while (!tokenValid);
        resolve(resp);
      } catch (err) {
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
        if (resp.statusCode === 401) {
          throw new Error('401');
          // I assume we can't do anything
        } else if (resp.statusCode !== 200) {
          throw new Error(`${resp.statusCode}`);
          // we need to retry here at some point
        }
        this.data.value.accessToken = resp.body.access_token;
        this.data.value.refreshToken = resp.body.refresh_token;
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Gets the channel's information and stores it in a replicant every 60 seconds.
   */
  async getChannelInfo(): Promise<void> {
    try {
      const resp = await this.get(`/channels/${this.data.value.channelID}`);
      this.channelDataTO = setTimeout((): Promise<void> => this.getChannelInfo(), 60 * 1000);
      if (resp.statusCode !== 200) {
        throw new Error(`${resp.statusCode}`);
      }
      this.channelData.value = resp.body;
    } catch (err) {
      // no data :(
    }
  }
}
