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
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var nodecg_1 = require("./nodecg");
var nodecg = nodecg_1.get();
/**
 * Takes a run data object and returns a formed string of the player names.
 * @param runData Run Data object.
 */
function formPlayerNamesStr(runData) {
    return runData.teams.map(function (team) { return (team.players.map(function (player) { return player.name; }).join(', ')); }).join(' vs. ') || 'N/A';
}
exports.formPlayerNamesStr = formPlayerNamesStr;
/**
 * Takes a run data object and returns an array of all associated Twitch usernames.
 * @param runData Run Data object.
 */
function getTwitchChannels(runData) {
    var _a;
    var channels = runData.teams.map(function (team) { return (team.players
        .filter(function (player) { return !!player.social.twitch; })
        .map(function (player) { return player.social.twitch; })); });
    return (_a = []).concat.apply(_a, channels);
}
exports.getTwitchChannels = getTwitchChannels;
/**
 * Checks if number needs a 0 adding to the start and does so if needed.
 * @param num Number which you want to turn into a padded string.
 */
function padTimeNumber(num) {
    return num.toString().padStart(2, '0');
}
exports.padTimeNumber = padTimeNumber;
/**
 * Converts a time string (HH:MM:SS) into milliseconds.
 * @param time Time string you wish to convert.
 */
function timeStrToMS(time) {
    var ts = time.split(':');
    if (ts.length === 2) {
        ts.unshift('00'); // Adds 0 hours if they are not specified.
    }
    return Date.UTC(1970, 0, 1, Number(ts[0]), Number(ts[1]), Number(ts[2]));
}
exports.timeStrToMS = timeStrToMS;
/**
 * Converts milliseconds into a time string (HH:MM:SS).
 * @param ms Milliseconds you wish to convert.
 */
function msToTimeStr(ms) {
    var seconds = Math.floor((ms / 1000) % 60);
    var minutes = Math.floor((ms / (1000 * 60)) % 60);
    var hours = Math.floor(ms / (1000 * 60 * 60));
    return padTimeNumber(hours) + ":" + padTimeNumber(minutes) + ":" + padTimeNumber(seconds);
}
exports.msToTimeStr = msToTimeStr;
/**
 * Allow a script to wait for an amount of milliseconds.
 * @param ms Milliseconds to sleep for.
 */
function sleep(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}
exports.sleep = sleep;
/**
 * Attempt to find a run in the run data array from it's ID.
 * @param id Unique ID of the run you want to attempt to find in the run data array.
 */
function findRunIndexFromId(id) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore: readReplicant not in NodeCGServer typings
    var arr = nodecg.readReplicant('runDataArray');
    return arr.findIndex(function (run) { return run.id === id; });
}
exports.findRunIndexFromId = findRunIndexFromId;
/**
 * Returns this bundle's configuration along with the correct typings.
 */
function bundleConfig() {
    return nodecg.bundleConfig;
}
exports.bundleConfig = bundleConfig;
/**
 * Simple helper function to handle NodeCG/our message acknowledgements.
 * @param ack The acknoledgement function itself.
 * @param err Error to supply if any.
 * @param data Anything else you want to send alongside.
 */
function processAck(ack, err, data) {
    if (ack && !ack.handled) {
        ack(err, data);
    }
}
exports.processAck = processAck;
/**
 * Takes a promise and returns error and result as an array.
 * @param promise Promise you want to process.
 */
function to(promise) {
    return __awaiter(this, void 0, void 0, function () {
        var data, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, promise];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, [null, data]];
                case 2:
                    err_1 = _a.sent();
                    return [2 /*return*/, [err_1]];
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.to = to;
/**
 * Returns a random integer between two values.
 * @param low Lowest number you want to return.
 * @param high Highest (but not including) number, usually an array length.
 */
function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
exports.randomInt = randomInt;
/**
 * Checks if the game name appears in the ignore list in the configuration.
 * @param game Game string (or null) to check against.
 */
function checkGameAgainstIgnoreList(game) {
    if (!game) {
        return false;
    }
    var list = bundleConfig().schedule.ignoreGamesWhileImporting || [];
    return !!list.find(function (str) { return !!str.toLowerCase().match(new RegExp("\\b" + lodash_1.default.escapeRegExp(game.toLowerCase()) + "\\b")); });
}
exports.checkGameAgainstIgnoreList = checkGameAgainstIgnoreList;
/**
 * Will attempt to extract the Twitch username from a Twitch URL if possible.
 */
function getTwitchUserFromURL(url) {
    var sanitised = (url === null || url === void 0 ? void 0 : url.endsWith('/')) ? url.substring(0, url.length - 1) : url;
    return sanitised && sanitised.includes('twitch.tv')
        ? sanitised.split('/')[sanitised.split('/').length - 1] : undefined;
}
exports.getTwitchUserFromURL = getTwitchUserFromURL;
