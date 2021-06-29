"use strict";
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
exports.searchForUserDataMultiple = exports.searchForUserData = exports.searchForTwitchGame = void 0;
const needle_1 = __importDefault(require("needle"));
const events = __importStar(require("./util/events"));
const helpers_1 = require("./util/helpers");
const nodecg_1 = require("./util/nodecg");
const nodecg = nodecg_1.get();
const userDataCache = {};
/**
 * Make a GET request to speedrun.com API.
 * @param url speedrun.com API endpoint you want to access.
 */
function get(endpoint) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            nodecg.log.debug(`[speedrun.com] API request processing on ${endpoint}`);
            const resp = yield needle_1.default('get', `https://www.speedrun.com/api/v1${endpoint}`, null, {
                headers: {
                    'User-Agent': 'nodecg-speedcontrol',
                    Accept: 'application/json',
                },
            });
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore: parser exists but isn't in the typings
            if (resp.parser !== 'json') {
                throw new Error('Response was not JSON');
                // We should retry here.
            }
            else if (resp.statusCode !== 200) {
                throw new Error(JSON.stringify(resp.body));
                // Do we need to retry here? Depends on err code.
            }
            nodecg.log.debug(`[speedrun.com] API request successful on ${endpoint}`);
            return resp;
        }
        catch (err) {
            nodecg.log.debug(`[speedrun.com] API request error on ${endpoint}:`, err);
            throw err;
        }
    });
}
/**
 * Returns the Twitch game name if set on speedrun.com.
 * @param query String you wish to try to find a game with.
 */
function searchForTwitchGame(query, abbr = false) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const endpoint = (abbr) ? 'abbreviation' : 'name';
            const resp = yield get(`/games?${endpoint}=${encodeURIComponent(query)}&max=1`);
            if (!resp.body.data.length) {
                throw new Error('No game matches');
            }
            else if (!resp.body.data[0].names.twitch) {
                throw new Error('Game was found but has no Twitch game set');
            }
            nodecg.log.debug(`[speedrun.com] Twitch game name found for "${query}":`, resp.body.data[0].names.twitch);
            return resp.body.data[0].names.twitch;
        }
        catch (err) {
            nodecg.log.debug(`[speedrun.com] Twitch game name lookup failed for "${query}":`, err);
            throw err;
        }
    });
}
exports.searchForTwitchGame = searchForTwitchGame;
/**
 * Returns the user's data if available on speedrun.com.
 * @param query Query you wish to try to find a user with, with parameter type and query value.
 */
function searchForUserData({ type, val }) {
    return __awaiter(this, void 0, void 0, function* () {
        const cacheKey = `${type}_${val}`;
        if (userDataCache[cacheKey]) {
            nodecg.log.debug(`[speedrun.com] User data found in cache for "${type}/${val}":`, JSON.stringify(userDataCache[cacheKey]));
            return userDataCache[cacheKey];
        }
        try {
            yield helpers_1.sleep(1000);
            const resp = yield get(`/users?${type}=${encodeURIComponent(val)}&max=10`);
            const results = resp.body.data;
            const exact = results.find((user) => {
                const exactToCheck = (() => {
                    var _a, _b;
                    switch (type) {
                        case 'name':
                        default:
                            return user.names.international;
                        case 'twitch':
                            return helpers_1.getTwitchUserFromURL((_a = user.twitch) === null || _a === void 0 ? void 0 : _a.uri);
                        case 'twitter':
                            return helpers_1.getTwitterUserFromURL((_b = user.twitter) === null || _b === void 0 ? void 0 : _b.uri);
                    }
                })();
                return exactToCheck
                    ? user.names.international.toLowerCase() === exactToCheck.toLowerCase()
                    : undefined;
            });
            const data = exact || results[0];
            if (!data) {
                throw new Error(`No user matches for "${type}/${val}"`);
            }
            if (data.pronouns) {
                // Erase any pronouns that are custom strings that used to be allowed.
                const split = data.pronouns.split(',').map((p) => p.trim().toLowerCase());
                if (!split.includes('he/him') && !split.includes('she/her') && !split.includes('they/them')) {
                    data.pronouns = '';
                }
            }
            userDataCache[cacheKey] = data; // Simple temp cache storage.
            nodecg.log.debug(`[speedrun.com] User data found for "${type}/${val}":`, JSON.stringify(resp.body.data[0]));
            return resp.body.data[0];
        }
        catch (err) {
            nodecg.log.debug(`[speedrun.com] User data lookup failed for "${type}/${val}":`, err);
            throw err;
        }
    });
}
exports.searchForUserData = searchForUserData;
/**
 * Try to find user data using multiple query types, will loop through them until one is successful.
 * Does not return any errors, if those happen this will just treat it as unsuccessful.
 * @param queries List of queries to use, if the val property in one is falsey it will be skipped.
 */
function searchForUserDataMultiple(...queries) {
    return __awaiter(this, void 0, void 0, function* () {
        let userData;
        for (const query of queries) {
            if (query.val) {
                try {
                    const { type, val } = query; // This is to help with Typing errors (for some reason).
                    const data = yield searchForUserData({ type, val });
                    userData = data;
                    break;
                }
                catch (err) {
                    // nothing found
                }
            }
        }
        return userData;
    });
}
exports.searchForUserDataMultiple = searchForUserDataMultiple;
// Our messaging system.
events.listenFor('srcomSearchForUserDataMultiple', (data, ack) => __awaiter(void 0, void 0, void 0, function* () {
    const resp = yield searchForUserDataMultiple(...data);
    helpers_1.processAck(ack, null, resp);
}));
