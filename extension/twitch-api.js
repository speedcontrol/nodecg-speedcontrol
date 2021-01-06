"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var needle_1 = __importDefault(require("needle"));
var events = __importStar(require("./util/events"));
var helpers_1 = require("./util/helpers");
var nodecg_1 = require("./util/nodecg");
var nodecg = nodecg_1.get();
var config = helpers_1.bundleConfig();
var app = express_1.default();
var apiData = nodecg.Replicant('twitchAPIData');
var channelInfo = nodecg.Replicant('twitchChannelInfo');
var commercialTimer = nodecg.Replicant('twitchCommercialTimer');
var channelInfoTO;
apiData.value.state = 'off'; // Set this to "off" on every start.
apiData.value.featuredChannels.length = 0; // Empty on every start.
/**
 * Logs out of the Twitch integration.
 */
function logout() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (apiData.value.state === 'off') {
                throw new Error('Integration not ready');
            }
            apiData.value = { state: 'off', sync: false, featuredChannels: [] };
            channelInfo.value = {};
            clearTimeout(channelInfoTO);
            nodecg.log.info('[Twitch] Integration successfully logged out');
            return [2 /*return*/];
        });
    });
}
/**
 * Validate the currently stored token against the Twitch ID API.
 */
function validateToken() {
    return __awaiter(this, void 0, void 0, function () {
        var resp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, needle_1.default('get', 'https://id.twitch.tv/oauth2/validate', null, {
                        headers: {
                            Authorization: "OAuth " + apiData.value.accessToken,
                        },
                    })];
                case 1:
                    resp = _a.sent();
                    if (resp.statusCode !== 200) {
                        throw new Error(JSON.stringify(resp.body));
                        // Do we need to retry here?
                    }
                    return [2 /*return*/, resp.body];
            }
        });
    });
}
/**
 * Refreshes the Twitch API access token, called whenever that is needed.
 */
function refreshToken() {
    return __awaiter(this, void 0, void 0, function () {
        var resp, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 4]);
                    nodecg.log.info('[Twitch] Attempting to refresh access token');
                    return [4 /*yield*/, needle_1.default('post', 'https://id.twitch.tv/oauth2/token', {
                            grant_type: 'refresh_token',
                            refresh_token: encodeURI(apiData.value.refreshToken),
                            client_id: config.twitch.clientID,
                            client_secret: config.twitch.clientSecret,
                        })];
                case 1:
                    resp = _a.sent();
                    if (resp.statusCode !== 200) {
                        throw new Error(JSON.stringify(resp.body));
                        // Do we need to retry here?
                    }
                    nodecg.log.info('[Twitch] Successfully refreshed access token');
                    apiData.value.accessToken = resp.body.access_token;
                    apiData.value.refreshToken = resp.body.refresh_token;
                    return [3 /*break*/, 4];
                case 2:
                    err_1 = _a.sent();
                    nodecg.log.warn('[Twitch] Error refreshing access token, you need to relogin');
                    nodecg.log.debug('[Twitch] Error refreshing access token:', err_1);
                    return [4 /*yield*/, helpers_1.to(logout())];
                case 3:
                    _a.sent();
                    throw err_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.refreshToken = refreshToken;
/**
 * Make a request to Twitch API v5.
 */
function request(method, endpoint, data, newAPI) {
    if (data === void 0) { data = null; }
    if (newAPI === void 0) { newAPI = false; }
    return __awaiter(this, void 0, void 0, function () {
        var ep, retry, attempts, resp, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ep = "/" + (newAPI ? 'helix' : 'kraken') + endpoint;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, , 9]);
                    nodecg.log.debug("[Twitch] API " + method.toUpperCase() + " request processing on " + ep);
                    retry = false;
                    attempts = 0;
                    resp = void 0;
                    _a.label = 2;
                case 2:
                    retry = false;
                    attempts += 1;
                    return [4 /*yield*/, needle_1.default(method, "https://api.twitch.tv" + ep, data, {
                            headers: {
                                Accept: !newAPI ? 'application/vnd.twitchtv.v5+json' : '',
                                'Content-Type': 'application/json',
                                Authorization: (newAPI ? 'Bearer' : 'OAuth') + " " + apiData.value.accessToken,
                                'Client-ID': config.twitch.clientID,
                            },
                        })];
                case 3:
                    // eslint-disable-next-line no-await-in-loop
                    resp = _a.sent();
                    if (!(resp.statusCode === 401 && attempts <= 1)) return [3 /*break*/, 5];
                    nodecg.log.debug("[Twitch] API " + method.toUpperCase() + " request "
                        + ("resulted in " + resp.statusCode + " on " + ep + ":"), JSON.stringify(resp.body));
                    return [4 /*yield*/, refreshToken()];
                case 4:
                    _a.sent(); // eslint-disable-line no-await-in-loop
                    retry = true;
                    return [3 /*break*/, 6];
                case 5:
                    if (resp.statusCode !== 200) {
                        throw new Error(JSON.stringify(resp.body));
                        // Do we need to retry here?
                    }
                    _a.label = 6;
                case 6:
                    if (retry) return [3 /*break*/, 2];
                    _a.label = 7;
                case 7:
                    nodecg.log.debug("[Twitch] API " + method.toUpperCase() + " request successful on " + ep);
                    return [2 /*return*/, resp];
                case 8:
                    err_2 = _a.sent();
                    nodecg.log.debug("[Twitch] API " + method.toUpperCase() + " request error on " + ep + ":", err_2);
                    throw err_2;
                case 9: return [2 /*return*/];
            }
        });
    });
}
/**
 * Gets the channel's information and stores it in a replicant every 60 seconds.
 */
function refreshChannelInfo() {
    return __awaiter(this, void 0, void 0, function () {
        var resp, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, request('get', "/channels/" + apiData.value.channelID)];
                case 1:
                    resp = _a.sent();
                    if (resp.statusCode !== 200) {
                        throw new Error(JSON.stringify(resp.body));
                    }
                    channelInfo.value = resp.body;
                    channelInfoTO = setTimeout(refreshChannelInfo, 60 * 1000);
                    return [3 /*break*/, 3];
                case 2:
                    err_3 = _a.sent();
                    // Try again after 10 seconds.
                    nodecg.log.warn('[Twitch] Error getting channel information');
                    nodecg.log.debug('[Twitch] Error getting channel information:', err_3);
                    channelInfoTO = setTimeout(refreshChannelInfo, 10 * 1000);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Returns the correct name of a game in the Twitch directory based on a search.
 * @param query String you wish to try to find a game with.
 */
function searchForGame(query) {
    return __awaiter(this, void 0, void 0, function () {
        var resp, results, exact;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (apiData.value.state !== 'on') {
                        throw new Error('Integration not ready');
                    }
                    return [4 /*yield*/, request('get', "/search/games?query=" + encodeURIComponent(query))];
                case 1:
                    resp = _a.sent();
                    if (resp.statusCode !== 200) {
                        throw new Error(JSON.stringify(resp.body));
                    }
                    else if (!resp.body.games || !resp.body.games.length) {
                        throw new Error("No game matches for \"" + query + "\"");
                    }
                    results = resp.body.games;
                    exact = results.find(function (game) { return game.name.toLowerCase() === query.toLowerCase(); });
                    return [2 /*return*/, (exact) ? exact.name : results[0].name];
            }
        });
    });
}
/**
 * Verify a Twitch directory exists and get the correct name if so.
 * Will return undefined if it cannot.
 * @param query String to use to find/verify the directory.
 */
function verifyTwitchDir(query) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, game;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, helpers_1.to(searchForGame(query))];
                case 1:
                    _a = _b.sent(), game = _a[1];
                    return [2 /*return*/, game];
            }
        });
    });
}
exports.verifyTwitchDir = verifyTwitchDir;
/**
 * Attempts to update the title/game on the set channel.
 * @param status Title to set.
 * @param game Game to set.
 */
function updateChannelInfo(status, game) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, dir, _b, resp, err_4;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (apiData.value.state !== 'on') {
                        throw new Error('Integration not ready');
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 6, , 7]);
                    nodecg.log.info('[Twitch] Attempting to update channel information');
                    if (!(game)) return [3 /*break*/, 3];
                    return [4 /*yield*/, helpers_1.to(verifyTwitchDir(game))];
                case 2:
                    _b = _c.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _b = [null, undefined];
                    _c.label = 4;
                case 4:
                    _a = _b, dir = _a[1];
                    return [4 /*yield*/, request('put', "/channels/" + apiData.value.channelID, {
                            channel: {
                                status: (status) ? status.slice(0, 140) : undefined,
                                game: dir || helpers_1.bundleConfig().twitch.streamDefaultGame,
                            },
                        })];
                case 5:
                    resp = _c.sent();
                    if (resp.statusCode !== 200) {
                        throw new Error(JSON.stringify(resp.body));
                    }
                    nodecg.log.info('[Twitch] Successfully updated channel information');
                    channelInfo.value = resp.body;
                    return [2 /*return*/, !dir];
                case 6:
                    err_4 = _c.sent();
                    nodecg.log.warn('[Twitch] Error updating channel information');
                    nodecg.log.debug('[Twitch] Error updating channel information:', err_4);
                    throw err_4;
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.updateChannelInfo = updateChannelInfo;
/**
 * Triggered when a commercial is started, and runs every second
 * until it has assumed to have ended, to update the relevant replicant.
 * We also do this during setup, in case there was one running when the app closed.
 */
function updateCommercialTimer() {
    var timer = commercialTimer.value;
    var remaining = timer.originalDuration - ((Date.now() - timer.timestamp) / 1000);
    if (remaining > 0) {
        commercialTimer.value.secondsRemaining = Math.round(remaining);
        setTimeout(updateCommercialTimer, 1000);
    }
    else {
        commercialTimer.value.secondsRemaining = 0;
    }
}
/**
 * Attempts to start a commercial on the set channel.
 */
function startCommercial(duration) {
    return __awaiter(this, void 0, void 0, function () {
        var dur, resp, err_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (apiData.value.state !== 'on') {
                        throw new Error('Integration not ready');
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    dur = duration && typeof duration === 'number'
                        && [30, 60, 90, 120, 150, 180].includes(duration) ? duration : 180;
                    nodecg.log.info('[Twitch] Requested a commercial to be started');
                    return [4 /*yield*/, request('post', "/channels/" + apiData.value.channelID + "/commercial", {
                            length: dur,
                        })];
                case 2:
                    resp = _a.sent();
                    if (resp.statusCode !== 200) {
                        throw new Error(JSON.stringify(resp.body));
                    }
                    // Update commercial timer values, trigger check logic.
                    commercialTimer.value.originalDuration = dur;
                    commercialTimer.value.secondsRemaining = dur;
                    commercialTimer.value.timestamp = Date.now();
                    updateCommercialTimer();
                    nodecg.log.info("[Twitch] Commercial started successfully (" + dur + " seconds)");
                    nodecg.sendMessage('twitchCommercialStarted', { duration: dur });
                    nodecg.sendMessage('twitchAdStarted', { duration: dur }); // Legacy
                    helpers_1.to(events.sendMessage('twitchCommercialStarted', { duration: dur }));
                    return [2 /*return*/, { duration: dur }];
                case 3:
                    err_5 = _a.sent();
                    nodecg.log.warn('[Twitch] Error starting commercial');
                    nodecg.log.debug('[Twitch] Error starting commercial:', err_5);
                    throw err_5;
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Setup done on both server boot (if token available) and initial auth flow.
 */
function setUp() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, err, resp, resp;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!!config.twitch.channelName) return [3 /*break*/, 5];
                    return [4 /*yield*/, helpers_1.to(validateToken())];
                case 1:
                    _a = _c.sent(), err = _a[0], resp = _a[1];
                    if (!err) return [3 /*break*/, 4];
                    return [4 /*yield*/, refreshToken()];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, helpers_1.to(validateToken())];
                case 3:
                    _b = _c.sent(), err = _b[0], resp = _b[1];
                    _c.label = 4;
                case 4:
                    if (!resp) {
                        throw new Error('No response while validating token');
                    }
                    apiData.value.channelID = resp.user_id;
                    apiData.value.channelName = resp.login;
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, request('get', "/users?login=" + config.twitch.channelName)];
                case 6:
                    resp = _c.sent();
                    if (!resp.body.users.length) {
                        throw new Error('channelName specified in the configuration not found');
                    }
                    apiData.value.channelID = resp.body.users[0]._id; // eslint-disable-line no-underscore-dangle
                    apiData.value.channelName = resp.body.users[0].name;
                    _c.label = 7;
                case 7:
                    clearTimeout(channelInfoTO);
                    apiData.value.state = 'on';
                    refreshChannelInfo();
                    updateCommercialTimer();
                    return [2 /*return*/];
            }
        });
    });
}
if (config.twitch.enabled) {
    nodecg.log.info('[Twitch] Integration enabled');
    // Listen for logout command from button on dashboard.
    nodecg.listenFor('twitchLogout', function (data, ack) {
        logout()
            .then(function () { return helpers_1.processAck(ack, null); })
            .catch(function (err) { return helpers_1.processAck(ack, err); });
    });
    // If we already have an access token stored, verify it.
    if (apiData.value.accessToken) {
        apiData.value.state = 'authenticating';
        setUp().then(function () {
            nodecg.log.info('[Twitch] Integration ready');
        }).catch(function (err) {
            nodecg.log.warn('[Twitch] Issue activating integration: ', err);
            helpers_1.to(logout());
        });
    }
    // Route that receives Twitch's auth code when the user does the flow from the dashboard.
    app.get('/nodecg-speedcontrol/twitchauth', function (req, res) {
        apiData.value.state = 'authenticating';
        needle_1.default('post', 'https://id.twitch.tv/oauth2/token', {
            client_id: config.twitch.clientID,
            client_secret: config.twitch.clientSecret,
            code: req.query.code,
            grant_type: 'authorization_code',
            redirect_uri: config.twitch.redirectURI,
        }).then(function (resp) {
            apiData.value.accessToken = resp.body.access_token;
            apiData.value.refreshToken = resp.body.refresh_token;
            setUp().then(function () {
                nodecg.log.info('[Twitch] Authentication successful');
                res.send('<b>Twitch authentication is now complete, '
                    + 'feel free to close this window/tab.</b>');
            }).catch(function () {
                throw new Error();
            });
        }).catch(function () {
            nodecg.log.warn('[Twitch] Issue with authentication');
            helpers_1.to(logout());
            res.send('<b>Error while processing the Twitch authentication, please try again.</b>');
        });
    });
    nodecg.mount(app);
}
// NodeCG messaging system.
nodecg.listenFor('twitchUpdateChannelInfo', function (data, ack) {
    updateChannelInfo(data.status, data.game)
        .then(function (noTwitchGame) { return helpers_1.processAck(ack, null, noTwitchGame); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
nodecg.listenFor('twitchStartCommercial', function (data, ack) {
    startCommercial(data.duration)
        .then(function () { return helpers_1.processAck(ack, null); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
nodecg.listenFor('playTwitchAd', function (data, ack) {
    startCommercial(data.duration)
        .then(function () { return helpers_1.processAck(ack, null); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
nodecg.listenFor('twitchAPIRequest', function (data, ack) {
    request(data.method, data.endpoint, data.data, data.newAPI)
        .then(function (resp) { return helpers_1.processAck(ack, null, resp); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
// Our messaging system.
events.listenFor('twitchUpdateChannelInfo', function (data, ack) {
    updateChannelInfo(data.status, data.game)
        .then(function (noTwitchGame) {
        helpers_1.processAck(ack, null, noTwitchGame);
        if (noTwitchGame) {
            nodecg.sendMessage('triggerAlert', 'NoTwitchGame');
        }
    })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
events.listenFor('twitchStartCommercial', function (data, ack) {
    startCommercial(data.duration)
        .then(function () { return helpers_1.processAck(ack, null); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
events.listenFor('twitchAPIRequest', function (data, ack) {
    request(data.method, data.endpoint, data.data, data.newAPI)
        .then(function (resp) { return helpers_1.processAck(ack, null, resp); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
