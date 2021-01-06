"use strict";
/* eslint import/prefer-default-export: off */
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
var twitch_api_1 = require("./twitch-api");
var events = __importStar(require("./util/events"));
var helpers_1 = require("./util/helpers"); // eslint-disable-line object-curly-newline, max-len
var nodecg_1 = require("./util/nodecg");
var nodecg = nodecg_1.get();
var config = helpers_1.bundleConfig();
var twitchAPIData = nodecg.Replicant('twitchAPIData');
var ws;
var msgNo = 1;
var pingTO;
/**
 * Sends messages to the WebSocket server, correctly formatted.
 * @param msg Message to be sent.
 */
function sendMsg(msg) {
    return new Promise(function (resolve) {
        if (!ws || ws.readyState !== 1) {
            throw new Error('WebSocket not connected');
        }
        nodecg.log.debug("[FrankerFaceZ] Attempting to send message: " + msgNo + " " + msg);
        ws.send(msgNo + " " + msg);
        var thisMsgNo = msgNo;
        msgNo += 1;
        var msgEvt = function (data) {
            if (ws && data.includes(thisMsgNo + " ok")) {
                nodecg.log.debug("[FrankerFaceZ] Message was successful: " + thisMsgNo + " " + msg);
                ws.removeListener('message', msgEvt);
                resolve(data.substr(data.indexOf(' ') + 1));
            }
        };
        ws.on('message', msgEvt);
    });
}
/**
 * Sent authentication code over Twitch chat.
 * @param auth Authentication code.
 */
function sendAuth(auth) {
    return __awaiter(this, void 0, void 0, function () {
        var opts, retry, attempts, client, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    nodecg.log.debug('[FrankerFaceZ] Attempting authentication');
                    opts = {
                        options: {
                        // debug: true,
                        },
                        connection: {
                            secure: true,
                        },
                        identity: {
                            username: twitchAPIData.value.channelName,
                            password: twitchAPIData.value.accessToken,
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
                    _a.sent();
                    nodecg.log.debug('[FrankerFaceZ] Connected to Twitch chat to authenticate');
                    return [4 /*yield*/, client.say('frankerfacezauthorizer', "AUTH " + auth)];
                case 3:
                    _a.sent();
                    client.disconnect();
                    return [3 /*break*/, 7];
                case 4:
                    err_1 = _a.sent();
                    if (!(err_1.includes('authentication failed') && attempts <= 1)) return [3 /*break*/, 6];
                    return [4 /*yield*/, helpers_1.to(twitch_api_1.refreshToken())];
                case 5:
                    _a.sent();
                    opts.identity.password = twitchAPIData.value.accessToken; // Update auth in opts.
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
}
/**
 * Set the featured channels.
 * @param names Array of usernames on Twitch.
 */
function setChannels(names) {
    return __awaiter(this, void 0, void 0, function () {
        var toSend, msg, clients, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!config.twitch.ffzIntegration) {
                        throw new Error('Integration not enabled');
                    }
                    nodecg.log.info('[FrankerFaceZ] Attempting to set featured channels');
                    toSend = names.filter(function (name) { return (!(config.twitch.ffzBlacklist || [])
                        .map(function (x) { return x.toLowerCase(); })
                        .includes(name.toLowerCase())); });
                    if (!!config.twitch.ffzUseRepeater) return [3 /*break*/, 5];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    if (config.twitch.channelName) {
                        throw new Error('Featured channels cannot be set while '
                            + 'channelName is set in the configuration file');
                    }
                    return [4 /*yield*/, sendMsg("update_follow_buttons " + JSON.stringify([
                            twitchAPIData.value.channelName,
                            toSend,
                        ]))];
                case 2:
                    msg = _a.sent();
                    clients = JSON.parse(msg.substr(3)).updated_clients;
                    nodecg.log.info("[FrankerFaceZ] Featured channels have been updated for " + clients + " viewers");
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    nodecg.log.warn('[FrankerFaceZ] Featured channels could not successfully be updated');
                    nodecg.log.debug('[FrankerFaceZ] Featured channels could not successfully be updated:', err_2);
                    throw err_2;
                case 4: return [3 /*break*/, 6];
                case 5:
                    helpers_1.to(events.sendMessage('repeaterFeaturedChannels', toSend));
                    nodecg.sendMessage('repeaterFeaturedChannels', toSend);
                    nodecg.log.info('[FrankerFaceZ] Featured channels being sent to repeater code');
                    _a.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.setChannels = setChannels;
/**
 * Pings the WebSocket server to check the connection is still alive.
 */
function ping() {
    var pongWaitTO;
    if (ws) {
        ws.ping();
        nodecg.log.debug('[FrankerFaceZ] PING sent');
    }
    var pongEvt = function () {
        nodecg.log.debug('[FrankerFaceZ] PONG received');
        clearTimeout(pongWaitTO);
        pingTO = setTimeout(ping, 60 * 1000);
        if (ws) {
            ws.removeListener('pong', pongEvt);
        }
    };
    if (ws) {
        ws.on('pong', pongEvt);
    }
    // Disconnect if a PONG was not received within 10 seconds.
    pongWaitTO = setTimeout(function () {
        nodecg.log.debug('[FrankerFaceZ] PING/PONG failed, terminating connection');
        if (ws) {
            ws.removeListener('pong', pongEvt);
            ws.terminate();
        }
    }, 10 * 1000);
}
/**
 * Picks a server to connect to randomly.
 */
function pickServer() {
    switch (helpers_1.randomInt(0, 20)) {
        default:
        case 0:
            return 'wss://catbag.frankerfacez.com/';
        case 1:
        case 2:
        case 3:
            return 'wss://andknuckles.frankerfacez.com/';
        case 4:
        case 5:
        case 6:
        case 7:
            return 'wss://tuturu.frankerfacez.com/';
        case 8:
        case 9:
        case 10:
        case 11:
            return 'wss://lilz.frankerfacez.com/';
        case 12:
        case 13:
        case 14:
        case 15:
            return 'wss://yoohoo.frankerfacez.com/';
        case 16:
        case 17:
        case 18:
        case 19:
            return 'wss://pog.frankerfacez.com/';
    }
}
/**
 * Sends the correct initial messages on WebSocket connect.
 */
function sendInitMsgs() {
    return __awaiter(this, void 0, void 0, function () {
        var messagesToSend;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    messagesToSend = [
                        'hello ["nodecg-speedcontrol",false]',
                        "setuser \"" + twitchAPIData.value.channelName + "\"",
                        "sub \"room." + twitchAPIData.value.channelName + "\"",
                        "sub \"channel." + twitchAPIData.value.channelName + "\"",
                        'ready 0',
                    ];
                    return [4 /*yield*/, p_iteration_1.forEachSeries(messagesToSend, function (msg) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, sendMsg(msg)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Connects to the WebSocket server.
 */
function connect() {
    msgNo = 1;
    var url = pickServer();
    ws = new ws_1.default(url);
    nodecg.log.info('[FrankerFaceZ] Connecting');
    nodecg.log.debug("[FrankerFaceZ] Using server " + url);
    ws.once('open', function () {
        sendInitMsgs().then(function () {
            pingTO = setTimeout(ping, 60 * 1000);
            nodecg.log.info('[FrankerFaceZ] Connection successful');
        });
    });
    // Catching any errors with the connection.
    // The "close" event is also fired if it's a disconnect.
    ws.on('error', function (err) {
        nodecg.log.warn('[FrankerFaceZ] Connection error occured');
        nodecg.log.debug('[FrankerFaceZ] Connection error occured:', err);
    });
    ws.once('close', function () {
        clearTimeout(pingTO);
        // No reconnection if Twitch API is disconnected.
        if (twitchAPIData.value.state === 'on') {
            nodecg.log.warn('[FrankerFaceZ] Connection closed, will reconnect in 10 seconds');
            setTimeout(connect, 10 * 1000);
        }
    });
    ws.on('message', function (data) {
        var _a;
        if (data.startsWith('-1')) {
            // If we need to authorize, gets the auth code and does that.
            // Original command will still be executed once authed,
            // so no need for any other checking.
            if (data.includes('do_authorize')) {
                sendAuth(JSON.parse(data.substr(16)));
            }
            // This is returned when the follower buttons are updated
            // (including through this application).
            if (data.includes('follow_buttons')) {
                nodecg.log.debug('[FrankerFaceZ] Received follow_buttons');
                var channels = JSON.parse(data.substr(18))[twitchAPIData.value.channelName];
                (_a = twitchAPIData.value.featuredChannels).splice.apply(_a, __spreadArrays([0,
                    twitchAPIData.value.featuredChannels.length], channels));
            }
        }
    });
}
if (config.twitch.enabled && config.twitch.ffzIntegration) {
    nodecg.log.info('[FrankerFaceZ] Integration enabled');
    twitchAPIData.on('change', function (newVal, oldVal) {
        if (newVal.state === 'on' && (!oldVal || oldVal.state !== 'on')) {
            connect();
        }
        else if (ws && oldVal && oldVal.state === 'on' && newVal.state !== 'on') {
            nodecg.log.info('[FrankerFaceZ] Connection closed');
            ws.close();
        }
    });
}
// NodeCG messaging system.
nodecg.listenFor('updateFeaturedChannels', function (names, ack) {
    setChannels(names)
        .then(function () { return helpers_1.processAck(ack, null); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
// Our messaging system.
events.listenFor('updateFeaturedChannels', function (names, ack) {
    setChannels(names)
        .then(function () { return helpers_1.processAck(ack, null); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
