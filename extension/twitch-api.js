"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateChannelInfo = exports.verifyTwitchDir = exports.refreshToken = void 0;
const needle_1 = __importDefault(require("needle"));
const events = __importStar(require("./util/events"));
const helpers_1 = require("./util/helpers");
const nodecg_1 = require("./util/nodecg");
const replicants_1 = require("./util/replicants");
const nodecg = (0, nodecg_1.get)();
const config = nodecg.bundleConfig;
const router = nodecg.Router();
let channelInfoTO;
replicants_1.twitchAPIData.value.state = 'off'; // Set this to "off" on every start.
if (!config.twitch.ffzUseRepeater) {
    // Empty on every start if not using the repeater setting.
    replicants_1.twitchAPIData.value.featuredChannels.length = 0;
}
/**
 * Logs out of the Twitch integration.
 */
function logout() {
    return __awaiter(this, void 0, void 0, function* () {
        if (replicants_1.twitchAPIData.value.state === 'off') {
            throw new Error('Integration not ready');
        }
        replicants_1.twitchAPIData.value = { state: 'off', sync: false, featuredChannels: [] };
        replicants_1.twitchChannelInfo.value = {};
        clearTimeout(channelInfoTO);
        nodecg.log.info('[Twitch] Integration successfully logged out');
    });
}
/**
 * Validate the currently stored token against the Twitch API.
 */
function validateToken() {
    return __awaiter(this, void 0, void 0, function* () {
        const resp = yield (0, needle_1.default)('get', 'https://id.twitch.tv/oauth2/validate', null, {
            headers: {
                Authorization: `OAuth ${replicants_1.twitchAPIData.value.accessToken}`,
            },
        });
        if (resp.statusCode !== 200) {
            throw new Error(JSON.stringify(resp.body));
            // Do we need to retry here?
        }
        return resp.body;
    });
}
/**
 * Refreshes the Twitch API access token, called whenever that is needed.
 */
function refreshToken() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            nodecg.log.info('[Twitch] Attempting to refresh access token');
            const resp = yield (0, needle_1.default)('post', 'https://id.twitch.tv/oauth2/token', {
                grant_type: 'refresh_token',
                refresh_token: encodeURI(replicants_1.twitchAPIData.value.refreshToken),
                client_id: config.twitch.clientID,
                client_secret: config.twitch.clientSecret,
            });
            if (resp.statusCode !== 200) {
                throw new Error(JSON.stringify(resp.body));
                // Do we need to retry here?
            }
            nodecg.log.info('[Twitch] Successfully refreshed access token');
            replicants_1.twitchAPIData.value.accessToken = resp.body.access_token;
            replicants_1.twitchAPIData.value.refreshToken = resp.body.refresh_token;
        }
        catch (err) {
            nodecg.log.warn('[Twitch] Error refreshing access token, you need to relogin');
            nodecg.log.debug('[Twitch] Error refreshing access token:', err);
            yield (0, helpers_1.to)(logout());
            throw err;
        }
    });
}
exports.refreshToken = refreshToken;
/**
 * Make a request to Twitch API.
 */
// eslint-disable-next-line max-len
function request(method, endpoint, data = null, newAPI = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const ep = `/${newAPI ? 'helix' : 'kraken'}${endpoint}`;
        try {
            nodecg.log.debug(`[Twitch] API ${method.toUpperCase()} request processing on ${ep}`);
            let retry = false;
            let attempts = 0;
            let resp;
            do {
                retry = false;
                attempts += 1;
                resp = yield (0, needle_1.default)(method, `https://api.twitch.tv${ep}`, data, {
                    headers: {
                        Accept: !newAPI ? 'application/vnd.twitchtv.v5+json' : '',
                        'Content-Type': 'application/json',
                        Authorization: `${newAPI ? 'Bearer' : 'OAuth'} ${replicants_1.twitchAPIData.value.accessToken}`,
                        'Client-ID': config.twitch.clientID,
                    },
                });
                if (resp.statusCode === 401 && attempts <= 1) {
                    nodecg.log.debug(`[Twitch] API ${method.toUpperCase()} request `
                        + `resulted in ${resp.statusCode} on ${ep}:`, JSON.stringify(resp.body));
                    yield refreshToken();
                    retry = true;
                    // Can a 401 mean something else?
                }
                else if (![200, 204].includes(resp.statusCode)) {
                    throw new Error(JSON.stringify(resp.body));
                    // Do we need to retry here?
                }
            } while (retry);
            nodecg.log.debug(`[Twitch] API ${method.toUpperCase()} request successful on ${ep}`);
            return resp;
        }
        catch (err) {
            nodecg.log.debug(`[Twitch] API ${method.toUpperCase()} request error on ${ep}:`, err);
            throw err;
        }
    });
}
/**
 * Gets the channel's information and stores it in a replicant every 60 seconds.
 */
function refreshChannelInfo() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const resp = yield request('get', `/channels?broadcaster_id=${replicants_1.twitchAPIData.value.channelID}`, null, true);
            if (resp.statusCode !== 200) {
                throw new Error(JSON.stringify(resp.body));
            }
            if (!resp.body.data.length) {
                throw new Error('channel with specified ID could not be found');
            }
            [replicants_1.twitchChannelInfo.value] = resp.body.data;
            channelInfoTO = setTimeout(refreshChannelInfo, 60 * 1000);
        }
        catch (err) {
            // Try again after 10 seconds.
            nodecg.log.warn('[Twitch] Error getting channel information');
            nodecg.log.debug('[Twitch] Error getting channel information:', err);
            channelInfoTO = setTimeout(refreshChannelInfo, 10 * 1000);
        }
    });
}
// TODO: Add delay to this?
/**
 * Returns the correct name of a game in the Twitch directory based on a search.
 * @param query String you wish to try to find a game with.
 */
function searchForGame(query) {
    return __awaiter(this, void 0, void 0, function* () {
        if (replicants_1.twitchAPIData.value.state !== 'on') {
            throw new Error('Integration not ready');
        }
        const resp = yield request('get', `/search/categories?query=${encodeURIComponent(query)}`, null, true);
        if (resp.statusCode !== 200) {
            throw new Error(JSON.stringify(resp.body));
        }
        else if (!resp.body.data || !resp.body.data.length) {
            throw new Error(`No game matches for "${query}"`);
        }
        const results = resp.body.data;
        const exact = results.find((game) => game.name.toLowerCase() === query.toLowerCase());
        return exact || results[0];
    });
}
/**
 * Verify a Twitch directory exists and get the correct name if so.
 * Will return undefined if it cannot.
 * @param query String to use to find/verify the directory.
 */
function verifyTwitchDir(query) {
    return __awaiter(this, void 0, void 0, function* () {
        const [, game] = yield (0, helpers_1.to)(searchForGame(query));
        return game;
    });
}
exports.verifyTwitchDir = verifyTwitchDir;
/**
 * Attempts to update the title/game on the set channel.
 * @param status Title to set.
 * @param game Game to set.
 */
function updateChannelInfo(title, game) {
    return __awaiter(this, void 0, void 0, function* () {
        if (replicants_1.twitchAPIData.value.state !== 'on') {
            throw new Error('Integration not ready');
        }
        try {
            nodecg.log.info('[Twitch] Attempting to update channel information');
            let noTwitchGame = false;
            let [, dir] = (game) ? yield (0, helpers_1.to)(verifyTwitchDir(game)) : [null, undefined];
            if (!dir && game) {
                // If no category found, find entry for default category.
                noTwitchGame = true;
                [, dir] = yield (0, helpers_1.to)(verifyTwitchDir(nodecg.bundleConfig.twitch.streamDefaultGame));
            }
            if (!config.twitch.metadataUseExternal) {
                const resp = yield request('patch', `/channels?broadcaster_id=${replicants_1.twitchAPIData.value.channelID}`, {
                    title: title === null || title === void 0 ? void 0 : title.slice(0, 140),
                    game_id: (dir === null || dir === void 0 ? void 0 : dir.id) || '',
                }, true);
                if (resp.statusCode !== 204) {
                    throw new Error(JSON.stringify(resp.body));
                }
            }
            else { // Send out message for external code to listen to.
                (0, helpers_1.to)(events.sendMessage('twitchExternalMetadata', {
                    channelID: replicants_1.twitchAPIData.value.channelID,
                    title: title === null || title === void 0 ? void 0 : title.slice(0, 140),
                    gameID: (dir === null || dir === void 0 ? void 0 : dir.id) || '',
                }));
                nodecg.sendMessage('twitchExternalMetadata', {
                    channelID: replicants_1.twitchAPIData.value.channelID,
                    title: title === null || title === void 0 ? void 0 : title.slice(0, 140),
                    gameID: (dir === null || dir === void 0 ? void 0 : dir.id) || '',
                });
                nodecg.log.info('[Twitch] Metadata request being sent to external script');
                // Currently we assume it worked and don't get a confirmation.
                // Checking *our* event system (server-to-server) isn't too hard, but checking
                // NodeCG's server-to-server can never work, so for now not implementing it.
                // For future-proofing, the message's types are set to allow an acknowledgement,
                // although the return data type is set to `void`.
            }
            nodecg.log.info('[Twitch] Successfully updated channel information');
            // "New" API doesn't return anything so update the data with what we've got.
            replicants_1.twitchChannelInfo.value.title = (title === null || title === void 0 ? void 0 : title.slice(0, 140)) || '';
            replicants_1.twitchChannelInfo.value.game_id = (dir === null || dir === void 0 ? void 0 : dir.id) || '';
            replicants_1.twitchChannelInfo.value.game_name = (dir === null || dir === void 0 ? void 0 : dir.name) || '';
            return noTwitchGame;
        }
        catch (err) {
            nodecg.log.warn('[Twitch] Error updating channel information');
            nodecg.log.debug('[Twitch] Error updating channel information:', err);
            throw err;
        }
    });
}
exports.updateChannelInfo = updateChannelInfo;
/**
 * Triggered when a commercial is started, and runs every second
 * until it has assumed to have ended, to update the relevant replicant.
 * We also do this during setup, in case there was one running when the app closed.
 */
function updateCommercialTimer() {
    const timer = replicants_1.twitchCommercialTimer.value;
    const remaining = timer.originalDuration - ((Date.now() - timer.timestamp) / 1000);
    if (remaining > 0) {
        replicants_1.twitchCommercialTimer.value.secondsRemaining = Math.round(remaining);
        setTimeout(updateCommercialTimer, 1000);
    }
    else {
        replicants_1.twitchCommercialTimer.value.secondsRemaining = 0;
    }
}
/**
 * Update commercial timer values, trigger check logic.
 */
function startCommercialTimer(dur) {
    if (replicants_1.twitchCommercialTimer.value.secondsRemaining > 0) {
        throw new Error('Commercial timer already running');
    }
    replicants_1.twitchCommercialTimer.value.originalDuration = dur;
    replicants_1.twitchCommercialTimer.value.secondsRemaining = dur;
    replicants_1.twitchCommercialTimer.value.timestamp = Date.now();
    updateCommercialTimer();
}
/**
 * Attempts to start a commercial on the set channel.
 */
function startCommercial(duration, fromDashboard = false) {
    return __awaiter(this, void 0, void 0, function* () {
        if (replicants_1.twitchAPIData.value.state !== 'on') {
            throw new Error('Integration not ready');
        }
        if (replicants_1.twitchCommercialTimer.value.secondsRemaining > 0) {
            throw new Error('Commercial already running');
        }
        nodecg.log.info('[Twitch] Requested a commercial to be started');
        const dur = duration && typeof duration === 'number' ? duration : 180;
        try {
            if (!config.twitch.commercialsUseExternal) {
                const resp = yield request('post', '/channels/commercial', {
                    broadcaster_id: replicants_1.twitchAPIData.value.channelID,
                    length: dur,
                }, true);
                if (resp.statusCode !== 200) {
                    throw new Error(JSON.stringify(resp.body));
                }
            }
            else { // Send out message for external code to listen to.
                (0, helpers_1.to)(events.sendMessage('twitchExternalCommercial', { duration: dur, fromDashboard }));
                nodecg.sendMessage('twitchExternalCommercial', { duration: dur, fromDashboard });
                nodecg.log.info('[Twitch] Commercial request being sent to external script');
                // Currently we assume it worked and don't get a confirmation.
                // Checking *our* event system (server-to-server) isn't too hard, but checking
                // NodeCG's server-to-server can never work, so for now not implementing it.
                // For future-proofing, the message's types are set to allow an acknowledgement.
            }
            startCommercialTimer(dur);
            nodecg.log.info(`[Twitch] Commercial started successfully (${dur} seconds)`);
            nodecg.sendMessage('twitchCommercialStarted', { duration: dur });
            nodecg.sendMessage('twitchAdStarted', { duration: dur }); // Legacy
            (0, helpers_1.to)(events.sendMessage('twitchCommercialStarted', { duration: dur }));
            return { duration: dur, fromDashboard };
        }
        catch (err) {
            nodecg.log.warn('[Twitch] Error starting commercial');
            nodecg.log.debug('[Twitch] Error starting commercial:', err);
            throw err;
        }
    });
}
/**
 * Setup done on both server boot (if token available) and initial auth flow.
 */
function setUp() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let userResp;
        if (!config.twitch.channelName) {
            let [err, resp] = yield (0, helpers_1.to)(validateToken());
            if (err) {
                yield refreshToken();
                [err, resp] = yield (0, helpers_1.to)(validateToken());
            }
            if (!resp) {
                throw new Error('No response while validating token');
            }
            replicants_1.twitchAPIData.value.channelID = resp.user_id;
            replicants_1.twitchAPIData.value.channelName = resp.login;
            userResp = yield request('get', `/users?id=${resp.user_id}`, null, true);
        }
        else {
            userResp = yield request('get', `/users?login=${config.twitch.channelName}`, null, true);
            if (!userResp.body.data.length) {
                throw new Error('channelName specified in the configuration not found');
            }
            replicants_1.twitchAPIData.value.channelID = userResp.body.data[0].id;
            replicants_1.twitchAPIData.value.channelName = userResp.body.data[0].login;
        }
        clearTimeout(channelInfoTO);
        replicants_1.twitchAPIData.value.state = 'on';
        replicants_1.twitchAPIData.value.broadcasterType = (_a = userResp.body.data[0]) === null || _a === void 0 ? void 0 : _a.broadcaster_type;
        refreshChannelInfo();
        updateCommercialTimer();
    });
}
if (config.twitch.enabled) {
    nodecg.log.info('[Twitch] Integration enabled');
    // Listen for logout command from button on dashboard.
    nodecg.listenFor('twitchLogout', (data, ack) => {
        logout()
            .then(() => (0, helpers_1.processAck)(ack, null))
            .catch((err) => (0, helpers_1.processAck)(ack, err));
    });
    // If we already have an access token stored, verify it.
    if (replicants_1.twitchAPIData.value.accessToken) {
        replicants_1.twitchAPIData.value.state = 'authenticating';
        setUp().then(() => {
            nodecg.log.info('[Twitch] Integration ready');
        }).catch((err) => {
            nodecg.log.warn('[Twitch] Issue activating integration: ', err);
            (0, helpers_1.to)(logout());
        });
    }
    // Route that receives Twitch's auth code when the user does the flow from the dashboard.
    router.get('/twitchauth', (req, res) => {
        replicants_1.twitchAPIData.value.state = 'authenticating';
        (0, needle_1.default)('post', 'https://id.twitch.tv/oauth2/token', {
            client_id: config.twitch.clientID,
            client_secret: config.twitch.clientSecret,
            code: req.query.code,
            grant_type: 'authorization_code',
            redirect_uri: config.twitch.redirectURI,
        }).then((resp) => {
            replicants_1.twitchAPIData.value.accessToken = resp.body.access_token;
            replicants_1.twitchAPIData.value.refreshToken = resp.body.refresh_token;
            setUp().then(() => {
                nodecg.log.info('[Twitch] Authentication successful');
                res.send('<b>Twitch authentication is now complete, '
                    + 'feel free to close this window/tab.</b>');
            }).catch(() => {
                throw new Error();
            });
        }).catch(() => {
            nodecg.log.warn('[Twitch] Issue with authentication');
            (0, helpers_1.to)(logout());
            res.send('<b>Error while processing the Twitch authentication, please try again.</b>');
        });
    });
    nodecg.mount('/nodecg-speedcontrol', router);
}
// NodeCG messaging system.
nodecg.listenFor('twitchUpdateChannelInfo', (data, ack) => {
    updateChannelInfo(data.status, data.game)
        .then((noTwitchGame) => (0, helpers_1.processAck)(ack, null, noTwitchGame))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
nodecg.listenFor('twitchStartCommercial', (data, ack) => {
    startCommercial(data.duration, data.fromDashboard)
        .then((resp) => (0, helpers_1.processAck)(ack, null, resp))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
nodecg.listenFor('playTwitchAd', (data, ack) => {
    startCommercial(data.duration, data.fromDashboard)
        .then((resp) => (0, helpers_1.processAck)(ack, null, resp))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
nodecg.listenFor('twitchStartCommercialTimer', (data, ack) => {
    try {
        startCommercialTimer(data.duration);
        (0, helpers_1.processAck)(ack, null);
    }
    catch (err) {
        (0, helpers_1.processAck)(ack, err);
    }
});
nodecg.listenFor('twitchAPIRequest', (data, ack) => {
    request(data.method, data.endpoint, data.data, data.newAPI)
        .then((resp) => (0, helpers_1.processAck)(ack, null, resp))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
// Our messaging system.
events.listenFor('twitchUpdateChannelInfo', (data, ack) => {
    updateChannelInfo(data.status, data.game)
        .then((noTwitchGame) => {
        (0, helpers_1.processAck)(ack, null, noTwitchGame);
        if (noTwitchGame) {
            nodecg.sendMessage('triggerAlert', 'NoTwitchGame');
        }
    })
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
events.listenFor('twitchStartCommercial', (data, ack) => {
    startCommercial(data.duration, data.fromDashboard)
        .then((resp) => (0, helpers_1.processAck)(ack, null, resp))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
events.listenFor('twitchStartCommercialTimer', (data, ack) => {
    try {
        startCommercialTimer(data.duration);
        (0, helpers_1.processAck)(ack, null);
    }
    catch (err) {
        (0, helpers_1.processAck)(ack, err);
    }
});
events.listenFor('twitchAPIRequest', (data, ack) => {
    request(data.method, data.endpoint, data.data, data.newAPI)
        .then((resp) => (0, helpers_1.processAck)(ack, null, resp))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
