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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
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
var p_iteration_1 = require("p-iteration");
var twitch_js_1 = __importDefault(require("twitch-js"));
var ws_1 = __importDefault(require("ws"));
var events = __importStar(require("./util/events"));
var helpers_1 = __importDefault(require("./util/helpers"));
var randomInt = helpers_1.default.randomInt, to = helpers_1.default.to, cgListenForHelper = helpers_1.default.cgListenForHelper;
var FFZWS = /** @class */ (function () {
    /* eslint-enable */
    function FFZWS(nodecg) {
        var _this = this;
        this.msgNo = 1;
        this.nodecg = nodecg;
        this.h = new helpers_1.default(nodecg);
        this.config = this.h.bundleConfig();
        this.twitchAPIData = nodecg.Replicant('twitchAPIData');
        if (this.config.twitch.enabled && this.config.twitch.ffzIntegration) {
            nodecg.log.info('FrankerFaceZ integration is enabled.');
            // Only listen if we're not using the repeater function.
            if (!this.config.twitch.ffzUseRepeater) {
                // NodeCG messaging system.
                this.nodecg.listenFor('ffzUpdateFeaturedChannels', function (data, ack) {
                    cgListenForHelper(_this.setChannels(data), ack);
                });
                // Our messaging system.
                events.listenFor('ffzUpdateFeaturedChannels', function (data, ack) {
                    _this.setChannels(data)
                        .then(function () { ack(null); })
                        .catch(function (err) { ack(err); });
                });
            }
            this.twitchAPIData.on('change', function (newVal, oldVal) {
                if (newVal.state === 'on' && (!oldVal || oldVal.state !== 'on')) {
                    _this.connect();
                }
                else if (_this.ws && oldVal && oldVal.state === 'on' && newVal.state !== 'on') {
                    nodecg.log.info('Connection to FrankerFaceZ closed.');
                    _this.ws.close();
                }
            });
        }
    }
    /**
     * Connects to the WebSocket server.
     */
    FFZWS.prototype.connect = function () {
        var _this = this;
        this.msgNo = 1;
        var url = FFZWS.pickServer();
        this.ws = new ws_1.default(url);
        this.nodecg.log.info('Connecting to FrankerFaceZ (%s).', url);
        this.ws.once('open', function () {
            _this.sendInitMsgs().then(function () {
                _this.pingTO = setTimeout(function () { return _this.ping(); }, 60 * 1000);
                _this.nodecg.log.info('Connection to FrankerFaceZ successful.');
            });
        });
        // Catching any errors with the connection.
        // The "close" event is also fired if it's a disconnect.
        this.ws.on('error', function (err) {
            _this.nodecg.log.warn('Error occurred on the FrankerFaceZ connection: %s', err);
        });
        this.ws.once('close', function () {
            clearTimeout(_this.pingTO);
            if (_this.twitchAPIData.value.state === 'on') { // No reconnection if Twitch API is disconnected.
                _this.nodecg.log.warn('Connection to FrankerFaceZ closed, will reconnect in 10 seconds.');
                setTimeout(function () { return _this.connect(); }, 10 * 1000);
            }
        });
        this.ws.on('message', function (data) {
            var _a;
            if (data.startsWith('-1')) {
                // If we need to authorize, gets the auth code and does that.
                // Original command will still be executed once authed,
                // so no need for any other checking.
                if (data.includes('do_authorize')) {
                    _this.sendAuth(JSON.parse(data.substr(16)));
                }
                // This is returned when the follower buttons are updated
                // (including through this application).
                if (data.includes('follow_buttons')) {
                    _this.nodecg.log.debug('Got follow_buttons from FrankerFaceZ connection.');
                    var channels = JSON.parse(data.substr(18))[_this.twitchAPIData.value.channelName];
                    (_a = _this.twitchAPIData.value.featuredChannels).splice.apply(_a, __spreadArrays([0,
                        _this.twitchAPIData.value.featuredChannels.length], channels));
                }
            }
        });
    };
    /**
     * Sends the correct initial messages on WebSocket connect.
     */
    FFZWS.prototype.sendInitMsgs = function () {
        var _this = this;
        return new Promise(function (resolve) {
            var messagesToSend = [
                'hello ["nodecg-speedcontrol",false]',
                "setuser \"" + _this.twitchAPIData.value.channelName + "\"",
                "sub \"room." + _this.twitchAPIData.value.channelName + "\"",
                "sub \"channel." + _this.twitchAPIData.value.channelName + "\"",
                'ready 0',
            ];
            p_iteration_1.forEachSeries(messagesToSend, function (msg) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.sendMsg(msg)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); }).then(resolve).catch(function () { });
        });
    };
    /**
     * Sends messages to the WebSocket server, correctly formatted.
     * @param msg Message to be sent.
     */
    FFZWS.prototype.sendMsg = function (msg) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.ws || _this.ws.readyState !== 1) {
                reject(new Error('FrankerFaceZ WebSocket not connected.'));
                return;
            }
            _this.ws.send(_this.msgNo + " " + msg);
            var thisMsgNo = _this.msgNo;
            _this.msgNo += 1;
            var msgEvt = function (data) {
                if (_this.ws && data.includes(thisMsgNo + " ok")) {
                    _this.ws.removeListener('message', msgEvt);
                    resolve(data.substr(data.indexOf(' ') + 1));
                }
            };
            _this.ws.on('message', msgEvt);
        });
    };
    /**
     * Sent authentication code over Twitch chat.
     * @param auth Authentication code.
     */
    FFZWS.prototype.sendAuth = function (auth) {
        return __awaiter(this, void 0, void 0, function () {
            var opts, retry, attempts, client, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.nodecg.log.info('Attempting to authenticate with FrankerFaceZ.');
                        opts = {
                            options: {
                            // debug: true,
                            },
                            connection: {
                                secure: true,
                            },
                            identity: {
                                username: this.twitchAPIData.value.channelName,
                                password: this.twitchAPIData.value.accessToken,
                            },
                        };
                        retry = false;
                        attempts = 0;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 7]);
                        retry = false;
                        attempts += 1;
                        client = new twitch_js_1.default.Client(opts);
                        return [4 /*yield*/, client.connect()];
                    case 2:
                        _a.sent(); // eslint-disable-line
                        this.nodecg.log.info('Connected to Twitch chat to authenticate with FrankerFaceZ.');
                        return [4 /*yield*/, client.say('frankerfacezauthorizer', "AUTH " + auth)];
                    case 3:
                        _a.sent(); // eslint-disable-line
                        client.disconnect();
                        return [3 /*break*/, 7];
                    case 4:
                        err_1 = _a.sent();
                        if (!(err_1.includes('authentication failed') && attempts <= 1)) return [3 /*break*/, 6];
                        return [4 /*yield*/, to(events.sendMessage('twitchRefreshToken'))];
                    case 5:
                        _a.sent(); // eslint-disable-line
                        opts.identity.password = this.twitchAPIData.value.accessToken; // Update auth in opts.
                        retry = true;
                        _a.label = 6;
                    case 6: return [3 /*break*/, 7];
                    case 7:
                        if (retry) return [3 /*break*/, 1];
                        _a.label = 8;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Set the featured channels.
     * @param names Array of usernames on Twitch.
     */
    FFZWS.prototype.setChannels = function (names) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.config.twitch.ffzIntegration) {
                reject(new Error('FrankerFaceZ integration is not enabled.'));
                return;
            }
            if (_this.config.twitch.channelName) {
                reject(new Error("FrankerFaceZ featured channels cannot be set while\n        channelName is set in the configuration file."));
                return;
            }
            _this.nodecg.log.info('Attempting to set FrankerFaceZ featured channels.');
            // Remove any blacklisted names.
            var toSend = names.filter(function (name) { return (!(_this.config.twitch.ffzBlacklist || [])
                .map(function (x) { return x.toLowerCase(); })
                .includes(name.toLowerCase())); });
            _this.sendMsg("update_follow_buttons " + JSON.stringify([
                _this.twitchAPIData.value.channelName,
                toSend,
            ])).then(function (msg) {
                var clients = JSON.parse(msg.substr(3)).updated_clients;
                _this.nodecg.log.info("FrankerFaceZ featured channels have been updated for " + clients + " viewers.");
                resolve();
            }).catch(function (err) {
                _this.nodecg.log.warn('FrankerFaceZ featured channels could not successfully be updated.');
                reject(err);
            });
        });
    };
    /**
     * Pings the WebSocket server to check the connection is still alive.
     */
    FFZWS.prototype.ping = function () {
        var _this = this;
        var pongWaitTO;
        if (this.ws) {
            this.ws.ping();
        }
        var pongEvt = function () {
            clearTimeout(pongWaitTO);
            _this.pingTO = setTimeout(function () { return _this.ping(); }, 60 * 1000);
            if (_this.ws) {
                _this.ws.removeListener('pong', pongEvt);
            }
        };
        if (this.ws) {
            this.ws.on('pong', pongEvt);
        }
        // Disconnect if a PONG was not received within 10 seconds.
        pongWaitTO = setTimeout(function () {
            _this.nodecg.log.warn('FrankerFaceZ PING/PONG failed, terminating connection.');
            if (_this.ws) {
                _this.ws.removeListener('pong', pongEvt);
                _this.ws.terminate();
            }
        }, 10 * 1000);
    };
    /**
     * Picks a server to connect to randomly.
     */
    FFZWS.pickServer = function () {
        switch (randomInt(0, 7)) {
            default:
            case 0:
                return 'wss://catbag.frankerfacez.com/';
            case 1:
            case 2:
                return 'wss://andknuckles.frankerfacez.com/';
            case 3:
            case 4:
                return 'wss://tuturu.frankerfacez.com/';
            case 5:
            case 6:
                return 'wss://lilz.frankerfacez.com/';
        }
    };
    return FFZWS;
}());
exports.default = FFZWS;
