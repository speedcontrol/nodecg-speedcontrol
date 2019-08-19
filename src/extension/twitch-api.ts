import express from 'express';
import needle, { BodyData, NeedleHttpVerbs, NeedleResponse } from 'needle';
import { ListenForCb } from 'nodecg/types/lib/nodecg-instance'; // eslint-disable-line
import { NodeCG, Replicant } from 'nodecg/types/server'; // eslint-disable-line
import { Configschema } from '../../configschema';
import { TwitchAPIData, TwitchChannelInfo } from '../../schemas';
import Helpers from './util/helpers';

const { processAck } = Helpers;

export default class TwitchAPI {
  /* eslint-disable */
  private nodecg: NodeCG;
  private h: Helpers;
  private config: Configschema;
  private data: Replicant<TwitchAPIData>
  private channelInfo: Replicant<TwitchChannelInfo>
  private channelInfoTO: NodeJS.Timeout | undefined;
  /* eslint-enable */

  constructor(nodecg: NodeCG) {
    this.nodecg = nodecg;
    this.h = new Helpers(nodecg);
    this.config = this.h.bundleConfig();
    this.data = nodecg.Replicant('twitchAPIData');
    this.channelInfo = nodecg.Replicant('twitchChannelInfo');
    const app = express();
    this.data.value.state = 'off'; // Set this to "off" on every start.

    if (this.config.twitch.enabled) {
      nodecg.log.info('Twitch integration is enabled.');

      this.nodecg.listenFor('updateChannelInfo', (msg, ack): Promise<void> => this.updateChannelInfo(msg.status, msg.game, ack));
      this.nodecg.listenFor('startTwitchCommercial', (msg, ack): Promise<void> => this.startCommercial(ack));
      this.nodecg.listenFor('playTwitchAd', (msg, ack): Promise<void> => this.startCommercial(ack)); // Legacy
      this.nodecg.listenFor('twitchLogout', (msg, ack): void => {
        this.logout().then((): void => {
          processAck(null, ack);
        }).catch((err): void => {
          processAck(err, ack);
        });
      });

      if (this.data.value.accessToken) {
        this.data.value.state = 'authenticating';
        this.validateToken().then((): void => {
          this.setUp();
        }).catch(async (): Promise<void> => {
          try {
            await this.refreshToken();
            this.setUp();
          } catch (err) {
            nodecg.log.warn('Issue activating Twitch integration.');
            try { await this.logout(); } catch { /* err */ }
          }
        });
      }

      // Route that receives Twitch's auth code when the user does the flow from the dashboard.
      app.get('/nodecg-speedcontrol/twitchauth', async (req, res): Promise<void> => {
        try {
          this.data.value.state = 'authenticating';
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
          nodecg.log.info('Twitch authentication successful.');
          res.send('<b>Twitch authentication is now complete, feel free to close this window/tab.</b>');
        } catch (err) {
          nodecg.log.warn('Issue with Twitch authentication.');
          try { await this.logout(); } catch { /* err */ }
          res.send('<b>Error while processing the Twitch authentication, please try again.</b>');
        }
      });

      nodecg.mount(app);
    }
  }

  /**
   * General set up stuff, done from above.
   */
  setUp(): void {
    global.clearTimeout(this.channelInfoTO as NodeJS.Timeout);
    this.data.value.state = 'on';
    this.getChannelInfo();
    this.nodecg.log.info('Twitch integration is ready.');
  }

  /**
   * Logs out of the Twitch integration.
   */
  logout(): Promise<void> {
    return new Promise((resolve, reject): void => {
      if (this.data.value.state === 'off') {
        reject(new Error('Twitch integration is not ready.'));
        return;
      }
      this.data.value = { state: 'off' };
      this.channelInfo.value = {};
      global.clearTimeout(this.channelInfoTO as NodeJS.Timeout);
      this.nodecg.log.info('Twitch integration successfully logged out.');
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
  request(method: NeedleHttpVerbs, endpoint: string, data: BodyData = {}): Promise<NeedleResponse> {
    return new Promise(async (resolve, reject): Promise<void> => {
      try {
        this.nodecg.log.debug(`Twitch API ${method.toUpperCase()} request processing on ${endpoint}.`);
        let reattempt = false;
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
          if (resp.statusCode === 401 && !reattempt) {
            this.nodecg.log.debug(
              `Twitch API ${method.toUpperCase()} request resulted in ${resp.statusCode} on ${endpoint}:`,
              JSON.stringify(resp.body),
            );
            await this.refreshToken(); // eslint-disable-line
            reattempt = true;
            // Can a 401 mean something else?
          } else if (resp.statusCode !== 200) {
            throw new Error(JSON.stringify(resp.body));
            // Do we need to retry here?
          }
        } while (reattempt);
        this.nodecg.log.debug(`Twitch API ${method.toUpperCase()} request successful on ${endpoint}.`);
        resolve(resp);
      } catch (err) {
        this.nodecg.log.debug(`Twitch API ${method.toUpperCase()} request error on ${endpoint}:`, err);
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
        this.nodecg.log.info('Attempting to refresh Twitch access token.');
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
        this.nodecg.log.info('Successfully refreshed Twitch access token.');
        this.data.value.accessToken = resp.body.access_token;
        this.data.value.refreshToken = resp.body.refresh_token;
        resolve();
      } catch (err) {
        this.nodecg.log.warn('Error refreshing Twitch access token, you need to relogin.');
        try { await this.logout(); } catch { /* err */ }
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
      this.channelInfo.value = resp.body;
      this.channelInfoTO = global.setTimeout(
        (): Promise<void> => this.getChannelInfo(),
        60 * 1000,
      );
    } catch (err) {
      // Try again after 10 seconds.
      this.nodecg.log.warn('Error getting Twitch channel information:', err.message);
      this.channelInfoTO = global.setTimeout(
        (): Promise<void> => this.getChannelInfo(),
        10 * 1000,
      );
    }
  }

  /**
   * Attempts to update the title/game on the set channel.
   * @param status Title to set.
   * @param game Game to set.
   * @param ack NodeCG message acknowledgement.
   */
  async updateChannelInfo(status: string, game: string, ack?: ListenForCb): Promise<void> {
    if (this.data.value.state !== 'on') {
      processAck(new Error('Twitch integration is not ready.'), ack);
      return;
    }
    try {
      this.nodecg.log.info('Attempting to update Twitch channel information.');
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
      this.nodecg.log.info('Successfully updated Twitch channel information.');
      this.channelInfo.value = resp.body;
      processAck(null, ack);
    } catch (err) {
      this.nodecg.log.warn('Error updating Twitch channel information:', err.message);
      processAck(err, ack);
    }
  }

  /**
   * Attempts to start a commercial on the set channel.
   * @param ack NodeCG message acknowledgement.
   */
  async startCommercial(ack?: ListenForCb): Promise<void> {
    if (this.data.value.state !== 'on') {
      processAck(new Error('Twitch integration is not ready.'), ack);
      return;
    }
    try {
      this.nodecg.log.info('Requested a Twitch commercial to be started.');
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
      this.nodecg.log.info('Twitch commercial started successfully.');
      this.nodecg.sendMessage('twitchCommercialStarted', { duration: 180 });
      this.nodecg.sendMessage('twitchAdStarted', { duration: 180 }); // Legacy
      processAck(null, ack, { duration: 180 });
    } catch (err) {
      this.nodecg.log.warn('Error starting Twitch commercial:', err.message);
      processAck(err, ack);
    }
  }
}
