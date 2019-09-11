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
var helpers_1 = __importDefault(require("./util/helpers"));
var cgListenForHelper = helpers_1.default.cgListenForHelper, to = helpers_1.default.to;
var TwitchAPI = /** @class */ (function () {
    /* eslint-enable */
    function TwitchAPI(nodecg) {
        var _this = this;
        this.nodecg = nodecg;
        this.h = new helpers_1.default(nodecg);
        this.config = this.h.bundleConfig();
        this.data = nodecg.Replicant('twitchAPIData');
        this.channelInfo = nodecg.Replicant('twitchChannelInfo');
        var app = express_1.default();
        this.data.value.state = 'off'; // Set this to "off" on every start.
        this.data.value.featuredChannels.length = 0; // Empty on every start.
        if (this.config.twitch.enabled) {
            nodecg.log.info('Twitch integration is enabled.');
            // NodeCG messaging system.
            this.nodecg.listenFor('twitchUpdateChannelInfo', function (data, ack) {
                cgListenForHelper(_this.updateChannelInfo(data.status, data.game), ack);
            });
            this.nodecg.listenFor('twitchStartCommercial', function (data, ack) {
                cgListenForHelper(_this.startCommercial(), ack);
            });
            this.nodecg.listenFor('playTwitchAd', function (data, ack) {
                cgListenForHelper(_this.startCommercial(), ack);
            });
            this.nodecg.listenFor('twitchLogout', function (data, ack) {
                cgListenForHelper(_this.logout(), ack);
            });
            // Our messaging system.
            events.listenFor('twitchUpdateChannelInfo', function (data, ack) {
                _this.updateChannelInfo(data.status, data.game)
                    .then(function () { ack(null); })
                    .catch(function (err) { ack(err); });
            });
            events.listenFor('twitchGameSearch', function (data, ack) {
                _this.searchForGame(data)
                    .then(function (data_) { ack(null, data_); })
                    .catch(function (err) { ack(err); });
            });
            events.listenFor('twitchRefreshToken', function (data, ack) {
                _this.refreshToken()
                    .then(function () { ack(null); })
                    .catch(function (err) { ack(err); });
            });
            if (this.data.value.accessToken) {
                this.data.value.state = 'authenticating';
                this.setUp().then(function () {
                    _this.nodecg.log.info('Twitch integration is ready.');
                }).catch(function () {
                    _this.nodecg.log.warn('Issue activating Twitch integration.');
                    to(_this.logout());
                });
            }
            // Route that receives Twitch's auth code when the user does the flow from the dashboard.
            app.get('/nodecg-speedcontrol/twitchauth', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var resp1, err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 5]);
                            this.data.value.state = 'authenticating';
                            return [4 /*yield*/, needle_1.default('post', 'https://id.twitch.tv/oauth2/token', {
                                    client_id: this.config.twitch.clientID,
                                    client_secret: this.config.twitch.clientSecret,
                                    code: req.query.code,
                                    grant_type: 'authorization_code',
                                    redirect_uri: this.config.twitch.redirectURI,
                                })];
                        case 1:
                            resp1 = _a.sent();
                            this.data.value.accessToken = resp1.body.access_token;
                            this.data.value.refreshToken = resp1.body.refresh_token;
                            return [4 /*yield*/, this.setUp()];
                        case 2:
                            _a.sent();
                            nodecg.log.info('Twitch authentication successful.');
                            res.send('<b>Twitch authentication is now complete, feel free to close this window/tab.</b>');
                            return [3 /*break*/, 5];
                        case 3:
                            err_1 = _a.sent();
                            nodecg.log.warn('Issue with Twitch authentication.');
                            return [4 /*yield*/, to(this.logout())];
                        case 4:
                            _a.sent();
                            res.send('<b>Error while processing the Twitch authentication, please try again.</b>');
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            }); });
            nodecg.mount(app);
        }
    }
    /**
     * Setup done on both server boot (if token available) and initial auth flow.
     */
    TwitchAPI.prototype.setUp = function () {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var _a, err, resp, resp, err_2;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 8, , 9]);
                        if (!!this.config.twitch.channelName) return [3 /*break*/, 5];
                        return [4 /*yield*/, to(this.validateToken())];
                    case 1:
                        _a = _c.sent(), err = _a[0], resp = _a[1];
                        if (!err) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.refreshToken()];
                    case 2:
                        _c.sent();
                        return [4 /*yield*/, to(this.validateToken())];
                    case 3:
                        _b = _c.sent(), err = _b[0], resp = _b[1];
                        _c.label = 4;
                    case 4:
                        this.data.value.channelID = resp.user_id;
                        this.data.value.channelName = resp.login;
                        return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, this.request('get', "/users?login=" + this.config.twitch.channelName)];
                    case 6:
                        resp = _c.sent();
                        if (!resp.body.users.length) {
                            throw new Error('channelName specified in the configuration not found on Twitch.');
                        }
                        this.data.value.channelID = resp.body.users[0]._id; // eslint-disable-line
                        this.data.value.channelName = resp.body.users[0].name;
                        _c.label = 7;
                    case 7:
                        global.clearTimeout(this.channelInfoTO);
                        this.data.value.state = 'on';
                        this.refreshChannelInfo();
                        resolve();
                        return [3 /*break*/, 9];
                    case 8:
                        err_2 = _c.sent();
                        reject();
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * Logs out of the Twitch integration.
     */
    TwitchAPI.prototype.logout = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.data.value.state === 'off') {
                reject(new Error('Twitch integration is not ready.'));
                return;
            }
            _this.data.value = { state: 'off', sync: false, featuredChannels: [] };
            _this.channelInfo.value = {};
            global.clearTimeout(_this.channelInfoTO);
            _this.nodecg.log.info('Twitch integration successfully logged out.');
            resolve();
        });
    };
    /**
     * Validate the currently stored token against the Twitch ID API.
     */
    TwitchAPI.prototype.validateToken = function () {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var resp, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, needle_1.default('get', 'https://id.twitch.tv/oauth2/validate', {}, {
                                headers: {
                                    Authorization: "OAuth " + this.data.value.accessToken,
                                },
                            })];
                    case 1:
                        resp = _a.sent();
                        if (resp.statusCode !== 200) {
                            throw new Error(JSON.stringify(resp.body));
                            // Do we need to retry here?
                        }
                        resolve(resp.body);
                        return [3 /*break*/, 3];
                    case 2:
                        err_3 = _a.sent();
                        reject(err_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * Make a request to Twitch API v5.
     * @param url Twitch API v5 endpoint you want to access.
     */
    TwitchAPI.prototype.request = function (method, endpoint, data) {
        var _this = this;
        if (data === void 0) { data = null; }
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var retry, attempts, resp, err_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        this.nodecg.log.debug("Twitch API " + method.toUpperCase() + " request processing on " + endpoint + ".");
                        retry = false;
                        attempts = 0;
                        resp = void 0;
                        _a.label = 1;
                    case 1:
                        retry = false;
                        attempts += 1;
                        return [4 /*yield*/, needle_1.default(method, "https://api.twitch.tv/kraken" + endpoint, data, {
                                headers: {
                                    Accept: 'application/vnd.twitchtv.v5+json',
                                    'Content-Type': 'application/json',
                                    Authorization: "OAuth " + this.data.value.accessToken,
                                    'Client-ID': this.h.bundleConfig().twitch.clientID,
                                },
                            })];
                    case 2:
                        // eslint-disable-next-line
                        resp = _a.sent();
                        if (!(resp.statusCode === 401 && attempts <= 1)) return [3 /*break*/, 4];
                        this.nodecg.log.debug("Twitch API " + method.toUpperCase() + " request resulted in " + resp.statusCode + " on " + endpoint + ":", JSON.stringify(resp.body));
                        return [4 /*yield*/, this.refreshToken()];
                    case 3:
                        _a.sent(); // eslint-disable-line
                        retry = true;
                        return [3 /*break*/, 5];
                    case 4:
                        if (resp.statusCode !== 200) {
                            throw new Error(JSON.stringify(resp.body));
                            // Do we need to retry here?
                        }
                        _a.label = 5;
                    case 5:
                        if (retry) return [3 /*break*/, 1];
                        _a.label = 6;
                    case 6:
                        this.nodecg.log.debug("Twitch API " + method.toUpperCase() + " request successful on " + endpoint + ".");
                        resolve(resp);
                        return [3 /*break*/, 8];
                    case 7:
                        err_4 = _a.sent();
                        this.nodecg.log.debug("Twitch API " + method.toUpperCase() + " request error on " + endpoint + ":", err_4);
                        reject(err_4);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * Refreshes the Twitch API access token, called whenever that is needed.
     */
    TwitchAPI.prototype.refreshToken = function () {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var resp, err_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 4]);
                        this.nodecg.log.info('Attempting to refresh Twitch access token.');
                        return [4 /*yield*/, needle_1.default('post', 'https://id.twitch.tv/oauth2/token', {
                                grant_type: 'refresh_token',
                                refresh_token: encodeURI(this.data.value.refreshToken),
                                client_id: this.config.twitch.clientID,
                                client_secret: this.config.twitch.clientSecret,
                            })];
                    case 1:
                        resp = _a.sent();
                        if (resp.statusCode !== 200) {
                            throw new Error(JSON.stringify(resp.body));
                            // Do we need to retry here?
                        }
                        this.nodecg.log.info('Successfully refreshed Twitch access token.');
                        this.data.value.accessToken = resp.body.access_token;
                        this.data.value.refreshToken = resp.body.refresh_token;
                        resolve();
                        return [3 /*break*/, 4];
                    case 2:
                        err_5 = _a.sent();
                        this.nodecg.log.warn('Error refreshing Twitch access token, you need to relogin.');
                        return [4 /*yield*/, to(this.logout())];
                    case 3:
                        _a.sent();
                        reject(err_5);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * Gets the channel's information and stores it in a replicant every 60 seconds.
     */
    TwitchAPI.prototype.refreshChannelInfo = function () {
        return __awaiter(this, void 0, void 0, function () {
            var resp, err_6;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.request('get', "/channels/" + this.data.value.channelID)];
                    case 1:
                        resp = _a.sent();
                        if (resp.statusCode !== 200) {
                            throw new Error(JSON.stringify(resp.body));
                        }
                        this.channelInfo.value = resp.body;
                        this.channelInfoTO = global.setTimeout(function () { return _this.refreshChannelInfo(); }, 60 * 1000);
                        return [3 /*break*/, 3];
                    case 2:
                        err_6 = _a.sent();
                        // Try again after 10 seconds.
                        this.nodecg.log.warn('Error getting Twitch channel information:', err_6.message);
                        this.channelInfoTO = global.setTimeout(function () { return _this.refreshChannelInfo(); }, 10 * 1000);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Attempts to update the title/game on the set channel.
     * @param status Title to set.
     * @param game Game to set.
     */
    TwitchAPI.prototype.updateChannelInfo = function (status, game) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var resp, err_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.data.value.state !== 'on') {
                            reject(new Error('Twitch integration is not ready.'));
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        this.nodecg.log.info('Attempting to update Twitch channel information.');
                        return [4 /*yield*/, this.request('put', "/channels/" + this.data.value.channelID, {
                                channel: {
                                    status: status,
                                    game: game,
                                },
                            })];
                    case 2:
                        resp = _a.sent();
                        if (resp.statusCode !== 200) {
                            throw new Error(JSON.stringify(resp.body));
                        }
                        this.nodecg.log.info('Successfully updated Twitch channel information.');
                        this.channelInfo.value = resp.body;
                        resolve();
                        return [3 /*break*/, 4];
                    case 3:
                        err_7 = _a.sent();
                        this.nodecg.log.warn('Error updating Twitch channel information:', err_7.message);
                        reject(err_7);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * Attempts to start a commercial on the set channel.
     */
    TwitchAPI.prototype.startCommercial = function () {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var resp, err_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.data.value.state !== 'on') {
                            reject(new Error('Twitch integration is not ready.'));
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        this.nodecg.log.info('Requested a Twitch commercial to be started.');
                        return [4 /*yield*/, this.request('post', "/channels/" + this.data.value.channelID + "/commercial", {
                                duration: 180,
                            })];
                    case 2:
                        resp = _a.sent();
                        if (resp.statusCode !== 200) {
                            throw new Error(JSON.stringify(resp.body));
                        }
                        this.nodecg.log.info('Twitch commercial started successfully.');
                        this.nodecg.sendMessage('twitchCommercialStarted', { duration: 180 });
                        this.nodecg.sendMessage('twitchAdStarted', { duration: 180 }); // Legacy
                        resolve({ duration: 180 });
                        return [3 /*break*/, 4];
                    case 3:
                        err_8 = _a.sent();
                        this.nodecg.log.warn('Error starting Twitch commercial:', err_8.message);
                        reject(err_8);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * Returns the correct name of a game in the Twitch directory based on a search.
     * @param query String you wish to try to find a game with.
     */
    TwitchAPI.prototype.searchForGame = function (query) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var resp, err_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.data.value.state !== 'on') {
                            reject(new Error('Twitch integration is not ready.'));
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.request('get', "/search/games?query=" + encodeURI(query))];
                    case 2:
                        resp = _a.sent();
                        if (resp.statusCode !== 200) {
                            throw new Error(JSON.stringify(resp.body));
                        }
                        else if (!resp.body.games || !resp.body.games.length) {
                            throw new Error("No game matches on Twitch for \"" + query + "\"");
                        }
                        resolve(resp.body.games[0].name);
                        return [3 /*break*/, 4];
                    case 3:
                        err_9 = _a.sent();
                        reject(err_9);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    };
    return TwitchAPI;
}());
exports.default = TwitchAPI;
