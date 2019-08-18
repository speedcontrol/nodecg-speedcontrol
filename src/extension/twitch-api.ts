import express from 'express';
import needle, { BodyData, NeedleHttpVerbs, NeedleResponse } from 'needle';
import { ListenForCb } from 'nodecg/types/lib/nodecg-instance'; // eslint-disable-line
import { NodeCG, Replicant } from 'nodecg/types/server'; // eslint-disable-line
import { Configschema } from '../../configschema';
import { TwitchAPIData, TwitchChannelData } from '../../schemas';
import Helpers from './util/helpers';

const { processAck } = Helpers;

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
          this.setUp();
        }).catch(async (): Promise<void> => {
          try {
            await this.refreshToken();
            this.setUp();
          } catch (err) {
            nodecg.log.warn('Issue activating Twitch integration, you need to relogin.');
          }
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
          this.setUp();
          res.send('<b>Twitch authentication is now complete, feel free to close this window/tab.</b>');
          nodecg.log.info('Twitch authentication successful.');
        } catch (err) {
          res.send('<b>Error while processing the Twitch authentication, please try again.</b>');
          nodecg.log.warn('Issue with Twitch authentication.');
        }
      });

      nodecg.mount(app);
    }
  }

  /**
   * General set up stuff, done from above.
   */
  setUp(): void {
    global.clearTimeout(this.channelDataTO as NodeJS.Timeout);
    this.data.value.ready = true;
    this.getChannelInfo();
    this.nodecg.listenFor('startTwitchCommercial', (msg, ack): Promise<void> => this.startCommercial(ack));
    this.nodecg.listenFor('playTwitchAd', (msg, ack): Promise<void> => this.startCommercial(ack)); // Legacy
    this.nodecg.log.info('Twitch integration is ready.');
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
  request(method: NeedleHttpVerbs, endpoint: string, data: BodyData = {}): Promise<NeedleResponse> {
    return new Promise(async (resolve, reject): Promise<void> => {
      try {
        let tokenValid = false;
        let resp;
        do {
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
              },
            },
          );
          if (resp.statusCode === 401) {
            await this.refreshToken(); // eslint-disable-line
            // Can a 401 mean something else?
          } else if (resp.statusCode !== 200) {
            throw new Error(JSON.stringify(resp.body));
            // Do we need to retry here?
          } else {
            tokenValid = true;
          }
        } while (!tokenValid);
        resolve(resp);
      } catch (err) {
        // Debug log as the other functions should handle the *correct* logging!
        this.nodecg.log.debug(`Twitch API error on ${endpoint}:`, err);
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
        if (resp.statusCode !== 200) {
          throw new Error(JSON.stringify(resp.body));
          // Do we need to retry here?
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
      const resp = await this.request('get', `/channels/${this.data.value.channelID}`);
      if (resp.statusCode !== 200) {
        throw new Error(JSON.stringify(resp.body));
      }
      this.channelData.value = resp.body;
      this.channelDataTO = global.setTimeout(
        (): Promise<void> => this.getChannelInfo(),
        60 * 1000,
      );
    } catch (err) {
      // Try again after 10 seconds.
      this.channelDataTO = global.setTimeout(
        (): Promise<void> => this.getChannelInfo(),
        10 * 1000,
      );
    }
  }

  /**
   * Attempts to run a commercial on the set channel.
   * @param ack NodeCG message acknowledgement.
   */
  async startCommercial(ack?: ListenForCb): Promise<void> {
    try {
      this.nodecg.log.info('Requested a Twitch commercial to be played.');
      const resp = await this.request(
        'post',
        `/channels/${this.data.value.channelID}/commercial`,
        {
          duration: 180,
        },
      );
      this.nodecg.log.info('Twitch commercial started successfully.');
      if (resp.statusCode !== 200) {
        throw new Error(JSON.stringify(resp.body));
      }
      processAck(null, ack);
    } catch (err) {
      this.nodecg.log.warn('Error running Twitch commercial:', err.message);
      processAck(err, ack);
    }
  }
}
