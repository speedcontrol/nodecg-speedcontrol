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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTwitterUserFromURL = exports.getTwitchUserFromURL = exports.checkGameAgainstIgnoreList = exports.randomInt = exports.to = exports.processAck = exports.findRunIndexFromId = exports.sleep = exports.msToTimeStr = exports.timeStrToMS = exports.padTimeNumber = exports.getTwitchChannels = exports.formatPlayersForTwitchTitle = void 0;
const lodash_1 = __importDefault(require("lodash"));
const nodecg_1 = require("./nodecg");
const nodecg = (0, nodecg_1.get)();
/**
 * Takes a run data object and returns a formed string of the player names for the Twitch title.
 * @param runData Run Data object.
 * @param mentionChannels Set to true to mention the player's Twitch channel in the title instead.
 */
function formatPlayersForTwitchTitle(runData, mentionChannels) {
    return runData.teams.map((team) => (team.players.map((player) => (mentionChannels && player.social.twitch
        ? `@${player.social.twitch}` : player.name)).join(', '))).join(' vs. ') || 'N/A';
}
exports.formatPlayersForTwitchTitle = formatPlayersForTwitchTitle;
/**
 * Takes a run data object and returns an array of all associated Twitch usernames.
 * @param runData Run Data object.
 */
function getTwitchChannels(runData) {
    const channels = runData.teams.map((team) => (team.players
        .filter((player) => !!player.social.twitch)
        .map((player) => player.social.twitch)));
    return [].concat(...channels);
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
    const ts = time.split(':');
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
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return `${padTimeNumber(hours)}:${padTimeNumber(minutes)}:${padTimeNumber(seconds)}`;
}
exports.msToTimeStr = msToTimeStr;
/**
 * Allow a script to wait for an amount of milliseconds.
 * @param ms Milliseconds to sleep for.
 */
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
exports.sleep = sleep;
/**
 * Attempt to find a run in the run data array from it's ID.
 * @param id Unique ID of the run you want to attempt to find in the run data array.
 */
function findRunIndexFromId(id) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: readReplicant not in NodeCGServer typings
    const arr = nodecg.readReplicant('runDataArray');
    return arr.findIndex((run) => run.id === id);
}
exports.findRunIndexFromId = findRunIndexFromId;
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
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield promise;
            return [null, data];
        }
        catch (err) {
            return [err];
        }
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
 * @param service Service we are checking against (just changes where to check in the config).
 */
function checkGameAgainstIgnoreList(game, service = 'horaro') {
    if (!game) {
        return false;
    }
    const list = service === 'horaro'
        ? (nodecg.bundleConfig.horaro || nodecg.bundleConfig.schedule).ignoreGamesWhileImporting || []
        : nodecg.bundleConfig.oengus.ignoreGamesWhileImporting
            || (nodecg.bundleConfig.horaro || nodecg.bundleConfig.schedule).ignoreGamesWhileImporting || [];
    return !!list.find((str) => !!str.toLowerCase().match(new RegExp(`\\b${lodash_1.default.escapeRegExp(game.toLowerCase())}\\b`)));
}
exports.checkGameAgainstIgnoreList = checkGameAgainstIgnoreList;
/**
 * Will attempt to extract the Twitch username from a Twitch URL if possible.
 */
function getTwitchUserFromURL(url) {
    const sanitised = (url === null || url === void 0 ? void 0 : url.endsWith('/')) ? url.substring(0, url.length - 1) : url;
    return sanitised && sanitised.includes('twitch.tv')
        ? sanitised.split('/')[sanitised.split('/').length - 1] : undefined;
}
exports.getTwitchUserFromURL = getTwitchUserFromURL;
/**
 * Will attempt to extract the Twitter username from a Twitter URL if possible.
 */
function getTwitterUserFromURL(url) {
    const sanitised = (url === null || url === void 0 ? void 0 : url.endsWith('/')) ? url.substring(0, url.length - 1) : url;
    return sanitised && sanitised.includes('twitter.com')
        ? sanitised.split('/')[sanitised.split('/').length - 1] : undefined;
}
exports.getTwitterUserFromURL = getTwitterUserFromURL;
