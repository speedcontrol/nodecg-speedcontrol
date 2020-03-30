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
var needle_1 = __importDefault(require("needle"));
var nodecg_1 = require("./util/nodecg");
var nodecg = nodecg_1.get();
var userDataCache = {};
/**
 * Make a GET request to speedrun.com API.
 * @param url speedrun.com API endpoint you want to access.
 */
function get(endpoint) {
    return __awaiter(this, void 0, void 0, function () {
        var resp, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    nodecg.log.debug("[speedrun.com] API request processing on " + endpoint);
                    return [4 /*yield*/, needle_1.default('get', "https://www.speedrun.com/api/v1" + endpoint, null, {
                            headers: {
                                'User-Agent': 'nodecg-speedcontrol',
                                Accept: 'application/json',
                            },
                        })];
                case 1:
                    resp = _a.sent();
                    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                    // @ts-ignore: parser exists but isn't in the typings
                    if (resp.parser !== 'json') {
                        throw new Error('Response was not JSON');
                        // We should retry here.
                    }
                    else if (resp.statusCode !== 200) {
                        throw new Error(JSON.stringify(resp.body));
                        // Do we need to retry here? Depends on err code.
                    }
                    nodecg.log.debug("[speedrun.com] API request successful on " + endpoint);
                    return [2 /*return*/, resp];
                case 2:
                    err_1 = _a.sent();
                    nodecg.log.debug("[speedrun.com] API request error on " + endpoint + ":", err_1);
                    throw err_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Returns the Twitch game name if set on speedrun.com.
 * @param query String you wish to try to find a game with.
 */
function searchForTwitchGame(query, abbr) {
    if (abbr === void 0) { abbr = false; }
    return __awaiter(this, void 0, void 0, function () {
        var endpoint, resp, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    endpoint = (abbr) ? 'abbreviation' : 'name';
                    return [4 /*yield*/, get("/games?" + endpoint + "=" + encodeURIComponent(query) + "&max=1")];
                case 1:
                    resp = _a.sent();
                    if (!resp.body.data.length) {
                        throw new Error('No game matches');
                    }
                    else if (!resp.body.data[0].names.twitch) {
                        throw new Error('Game was found but has no Twitch game set');
                    }
                    nodecg.log.debug("[speedrun.com] Twitch game name found for \"" + query + "\":", resp.body.data[0].names.twitch);
                    return [2 /*return*/, resp.body.data[0].names.twitch];
                case 2:
                    err_2 = _a.sent();
                    nodecg.log.debug("[speedrun.com] Twitch game name lookup failed for \"" + query + "\":", err_2);
                    throw err_2;
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.searchForTwitchGame = searchForTwitchGame;
/**
 * Returns the user's data if available on speedrun.com.
 * @param query String you wish to try to find a user with.
 */
function searchForUserData(query) {
    return __awaiter(this, void 0, void 0, function () {
        var resp, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (userDataCache[query]) {
                        nodecg.log.debug("[speedrun.com] User data found in cache for \"" + query + "\":", JSON.stringify(userDataCache[query]));
                        return [2 /*return*/, userDataCache[query]];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, get("/users?lookup=" + encodeURIComponent(query) + "&max=1")];
                case 2:
                    resp = _a.sent();
                    if (!resp.body.data.length) {
                        throw new Error("No user matches for \"" + query + "\"");
                    }
                    userDataCache[query] = resp.body.data[0]; // Simple temp cache storage.
                    nodecg.log.debug("[speedrun.com] User data found for \"" + query + "\":", JSON.stringify(resp.body.data[0]));
                    return [2 /*return*/, resp.body.data[0]];
                case 3:
                    err_3 = _a.sent();
                    nodecg.log.debug("[speedrun.com] User data lookup failed for \"" + query + "\":", err_3);
                    throw err_3;
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.searchForUserData = searchForUserData;
/**
 * Try to find user data using multiple strings, will loop through them until one is successful.
 * Does not return any errors, if those happen this will just treat it as unsuccessful.
 * @param queries List of queries to use, if any are falsey they will be skipped.
 */
function searchForUserDataMultiple() {
    var queries = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        queries[_i] = arguments[_i];
    }
    return __awaiter(this, void 0, void 0, function () {
        var userData, _a, queries_1, query, data, err_4;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = 0, queries_1 = queries;
                    _b.label = 1;
                case 1:
                    if (!(_a < queries_1.length)) return [3 /*break*/, 6];
                    query = queries_1[_a];
                    if (!query) return [3 /*break*/, 5];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, searchForUserData(query)];
                case 3:
                    data = _b.sent();
                    userData = data;
                    return [3 /*break*/, 6];
                case 4:
                    err_4 = _b.sent();
                    return [3 /*break*/, 5];
                case 5:
                    _a++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/, userData];
            }
        });
    });
}
exports.searchForUserDataMultiple = searchForUserDataMultiple;
