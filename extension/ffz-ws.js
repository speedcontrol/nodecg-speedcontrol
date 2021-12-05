"use strict";
/* eslint import/prefer-default-export: off */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.setChannels = void 0;
const p_iteration_1 = require("p-iteration");
const tmi_js_1 = __importDefault(require("tmi.js"));
const ws_1 = __importDefault(require("ws"));
const twitch_api_1 = require("./twitch-api");
const events = __importStar(require("./util/events"));
const helpers_1 = require("./util/helpers"); // eslint-disable-line object-curly-newline, max-len
const nodecg_1 = require("./util/nodecg");
const replicants_1 = require("./util/replicants");
const nodecg = (0, nodecg_1.get)();
const config = (0, helpers_1.bundleConfig)();
let ws;
let msgNo = 1;
let pingTO;
/**
 * Sends messages to the WebSocket server, correctly formatted.
 * @param msg Message to be sent.
 */
function sendMsg(msg) {
    return new Promise((resolve) => {
        if (!ws || ws.readyState !== 1) {
            throw new Error('WebSocket not connected');
        }
        nodecg.log.debug(`[FrankerFaceZ] Attempting to send message: ${msgNo} ${msg}`);
        ws.send(`${msgNo} ${msg}`);
        const thisMsgNo = msgNo;
        msgNo += 1;
        const msgEvt = (data) => {
            if (ws && data.includes(`${thisMsgNo} ok`)) {
                nodecg.log.debug(`[FrankerFaceZ] Message was successful: ${thisMsgNo} ${msg}`);
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
    return __awaiter(this, void 0, void 0, function* () {
        nodecg.log.debug('[FrankerFaceZ] Attempting authentication');
        const opts = {
            options: {
            // debug: true,
            },
            connection: {
                secure: true,
            },
            identity: {
                username: replicants_1.twitchAPIData.value.channelName,
                password: replicants_1.twitchAPIData.value.accessToken,
            },
        };
        let retry = false;
        let attempts = 0;
        do {
            try {
                retry = false;
                attempts += 1;
                const client = new tmi_js_1.default.Client(opts);
                yield client.connect();
                nodecg.log.debug('[FrankerFaceZ] Connected to Twitch chat to authenticate');
                yield client.say('frankerfacezauthorizer', `AUTH ${auth}`);
                client.disconnect();
            }
            catch (err) {
                if (err.includes('authentication failed') && attempts <= 1) {
                    yield (0, helpers_1.to)((0, twitch_api_1.refreshToken)());
                    opts.identity.password = replicants_1.twitchAPIData.value.accessToken; // Update auth in opts.
                    retry = true;
                }
            }
        } while (retry);
        /* eslint-enable */
    });
}
/**
 * Set the featured channels.
 * @param names Array of usernames on Twitch.
 */
function setChannels(names) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!config.twitch.ffzIntegration) {
            throw new Error('Integration not enabled');
        }
        nodecg.log.info('[FrankerFaceZ] Attempting to set featured channels');
        // Remove any blacklisted names.
        const toSend = names.filter((name) => (!(config.twitch.ffzBlacklist || [])
            .map((x) => x.toLowerCase())
            .includes(name.toLowerCase())));
        if (!config.twitch.ffzUseRepeater) {
            try {
                if (config.twitch.channelName) {
                    throw new Error('Featured channels cannot be set while '
                        + 'channelName is set in the configuration file');
                }
                const msg = yield sendMsg(`update_follow_buttons ${JSON.stringify([
                    replicants_1.twitchAPIData.value.channelName,
                    toSend,
                ])}`);
                const clients = JSON.parse(msg.substr(3)).updated_clients;
                nodecg.log.info(`[FrankerFaceZ] Featured channels have been updated for ${clients} viewers`);
            }
            catch (err) {
                nodecg.log.warn('[FrankerFaceZ] Featured channels could not successfully be updated');
                nodecg.log.debug('[FrankerFaceZ] Featured channels could not successfully be updated:', err);
                throw err;
            }
        }
        else { // Send out message for external code to listen to.
            (0, helpers_1.to)(events.sendMessage('repeaterFeaturedChannels', toSend));
            nodecg.sendMessage('repeaterFeaturedChannels', toSend);
            nodecg.log.info('[FrankerFaceZ] Featured channels being sent to repeater code');
            replicants_1.twitchAPIData.value.featuredChannels = toSend;
        }
    });
}
exports.setChannels = setChannels;
/**
 * Pings the WebSocket server to check the connection is still alive.
 */
function ping() {
    let pongWaitTO;
    if (ws) {
        ws.ping();
        nodecg.log.debug('[FrankerFaceZ] PING sent');
    }
    const pongEvt = () => {
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
    pongWaitTO = setTimeout(() => {
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
    switch ((0, helpers_1.randomInt)(0, 20)) {
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
    return __awaiter(this, void 0, void 0, function* () {
        const messagesToSend = [
            'hello ["nodecg-speedcontrol",false]',
            `setuser "${replicants_1.twitchAPIData.value.channelName}"`,
            `sub "room.${replicants_1.twitchAPIData.value.channelName}"`,
            `sub "channel.${replicants_1.twitchAPIData.value.channelName}"`,
            'ready 0',
        ];
        yield (0, p_iteration_1.forEachSeries)(messagesToSend, (msg) => __awaiter(this, void 0, void 0, function* () {
            yield sendMsg(msg);
        }));
    });
}
/**
 * Connects to the WebSocket server.
 */
function connect() {
    msgNo = 1;
    const url = pickServer();
    ws = new ws_1.default(url);
    nodecg.log.info('[FrankerFaceZ] Connecting');
    nodecg.log.debug(`[FrankerFaceZ] Using server ${url}`);
    ws.once('open', () => {
        sendInitMsgs().then(() => {
            pingTO = setTimeout(ping, 60 * 1000);
            nodecg.log.info('[FrankerFaceZ] Connection successful');
        });
    });
    // Catching any errors with the connection.
    // The "close" event is also fired if it's a disconnect.
    ws.on('error', (err) => {
        nodecg.log.warn('[FrankerFaceZ] Connection error occured');
        nodecg.log.debug('[FrankerFaceZ] Connection error occured:', err);
    });
    ws.once('close', () => {
        clearTimeout(pingTO);
        // No reconnection if Twitch API is disconnected.
        if (replicants_1.twitchAPIData.value.state === 'on') {
            nodecg.log.warn('[FrankerFaceZ] Connection closed, will reconnect in 10 seconds');
            setTimeout(connect, 10 * 1000);
        }
    });
    ws.on('message', (data) => {
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
                const channels = JSON.parse(data.substr(18))[replicants_1.twitchAPIData.value.channelName];
                replicants_1.twitchAPIData.value.featuredChannels.splice(0, replicants_1.twitchAPIData.value.featuredChannels.length, ...channels);
            }
        }
    });
}
if (config.twitch.enabled && config.twitch.ffzIntegration) {
    nodecg.log.info('[FrankerFaceZ] Integration enabled');
    // Only connect to FFZ's server if not using repeater.
    if (!config.twitch.ffzUseRepeater) {
        replicants_1.twitchAPIData.on('change', (newVal, oldVal) => {
            if (newVal.state === 'on' && (!oldVal || oldVal.state !== 'on')) {
                connect();
            }
            else if (ws && oldVal && oldVal.state === 'on' && newVal.state !== 'on') {
                nodecg.log.info('[FrankerFaceZ] Connection closed');
                ws.close();
            }
        });
    }
}
// NodeCG messaging system.
nodecg.listenFor('updateFeaturedChannels', (names, ack) => {
    setChannels(names)
        .then(() => (0, helpers_1.processAck)(ack, null))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
// Our messaging system.
events.listenFor('updateFeaturedChannels', (names, ack) => {
    setChannels(names)
        .then(() => (0, helpers_1.processAck)(ack, null))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
