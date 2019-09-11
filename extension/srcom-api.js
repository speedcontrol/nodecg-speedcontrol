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
var needle_1 = __importDefault(require("needle"));
var events = __importStar(require("./util/events"));
var SRComAPI = /** @class */ (function () {
    /* eslint-enable */
    function SRComAPI(nodecg) {
        var _this = this;
        this.userDataCache = {};
        this.nodecg = nodecg;
        // Our messaging system.
        events.listenFor('srcomTwitchGameSearch', function (data, ack) {
            _this.searchForTwitchGame(data)
                .then(function (data_) { ack(null, data_); })
                .catch(function (err) { ack(err); });
        });
        events.listenFor('srcomUserSearch', function (data, ack) {
            _this.searchForUserData(data)
                .then(function (data_) { ack(null, data_); })
                .catch(function (err) { ack(err); });
        });
    }
    /**
     * Make a GET request to speedrun.com API.
     * @param url speedrun.com API endpoint you want to access.
     */
    SRComAPI.prototype.get = function (endpoint) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var resp, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.nodecg.log.debug("speedrun.com API request processing on " + endpoint + ".");
                        return [4 /*yield*/, needle_1.default('get', "https://www.speedrun.com/api/v1" + endpoint, null, {
                                headers: {
                                    'User-Agent': 'nodecg-speedcontrol',
                                    Accept: 'application/json',
                                },
                            })];
                    case 1:
                        resp = _a.sent();
                        // @ts-ignore: parser exists but isn't in the typings
                        if (resp.parser !== 'json') {
                            throw new Error('Response was not JSON.');
                        }
                        else if (resp.statusCode !== 200) {
                            throw new Error(JSON.stringify(resp.body));
                            // Do we need to retry here?
                        }
                        this.nodecg.log.debug("speedrun.com API request successful on " + endpoint + ".");
                        resolve(resp);
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _a.sent();
                        this.nodecg.log.debug("speedrun.com API request error on " + endpoint + ":", err_1);
                        reject(err_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * Returns the Twitch game name if set on speedrun.com.
     * @param query String you wish to try to find a game with.
     */
    SRComAPI.prototype.searchForTwitchGame = function (query) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var resp, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.get("/games?name=" + encodeURI(query) + "&max=1")];
                    case 1:
                        resp = _a.sent();
                        if (resp.statusCode !== 200) {
                            throw new Error(JSON.stringify(resp.body));
                        }
                        else if (!resp.body.data.length) {
                            throw new Error("No game matches on speedrun.com for \"" + query + "\"");
                        }
                        else if (!resp.body.data[0].names.twitch) {
                            throw new Error("No Twitch game name found on speedrun.com for \"" + query + "\"");
                        }
                        resolve(resp.body.data[0].names.twitch);
                        return [3 /*break*/, 3];
                    case 2:
                        err_2 = _a.sent();
                        reject(err_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * Returns the user's data if available on speedrun.com.
     * @param query String you wish to try to find a user with.
     */
    SRComAPI.prototype.searchForUserData = function (query) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var resp, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.userDataCache[query]) {
                            resolve(this.userDataCache[query]);
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.get("/users?lookup=" + encodeURI(query) + "&max=1")];
                    case 2:
                        resp = _a.sent();
                        if (resp.statusCode !== 200) {
                            throw new Error(JSON.stringify(resp.body));
                        }
                        else if (!resp.body.data.length) {
                            throw new Error("No user matches on speedrun.com for \"" + query + "\"");
                        }
                        this.userDataCache[query] = resp.body.data[0]; // Simple temporary cache storage.
                        resolve(resp.body.data[0]);
                        return [3 /*break*/, 4];
                    case 3:
                        err_3 = _a.sent();
                        reject(err_3);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    };
    return SRComAPI;
}());
exports.default = SRComAPI;
