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
var iso8601_duration_1 = require("iso8601-duration");
var needle_1 = __importDefault(require("needle"));
var p_iteration_1 = require("p-iteration");
var uuid_1 = require("uuid");
var srcom_api_1 = require("./srcom-api");
var twitch_api_1 = require("./twitch-api");
var helpers_1 = require("./util/helpers"); // eslint-disable-line object-curly-newline, max-len
var nodecg_1 = require("./util/nodecg");
var nodecg = nodecg_1.get();
var config = helpers_1.bundleConfig();
var importStatus = nodecg.Replicant('oengusImportStatus', {
    persistent: false,
});
var runDataArray = nodecg.Replicant('runDataArray');
var defaultSetupTime = nodecg.Replicant('defaultSetupTime');
/**
 * Make a GET request to Oengus API.
 * @param endpoint Oengus API endpoint you want to access.
 */
function get(endpoint) {
    return __awaiter(this, void 0, void 0, function () {
        var resp, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    nodecg.log.debug("[Oengus Import] API request processing on " + endpoint);
                    return [4 /*yield*/, needle_1.default('get', "https://oengus.io/api" + endpoint, null, {
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
                    }
                    else if (resp.statusCode !== 200) {
                        throw new Error(JSON.stringify(resp.body));
                    }
                    nodecg.log.debug("[Oengus Import] API request successful on " + endpoint);
                    return [2 /*return*/, resp];
                case 2:
                    err_1 = _a.sent();
                    nodecg.log.debug("[Oengus Import] API request error on " + endpoint + ":", err_1);
                    throw err_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Format to time string from Duration object.
 * @param duration Duration object you want to format.
 */
function formatDuration(duration) {
    var digits = [];
    digits.push(duration.hours ? helpers_1.padTimeNumber(duration.hours) : '00');
    digits.push(duration.minutes ? helpers_1.padTimeNumber(duration.minutes) : '00');
    digits.push(duration.seconds ? helpers_1.padTimeNumber(duration.seconds) : '00');
    return digits.join(':');
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isOengusMarathon(source) {
    return (typeof source.id === 'string' && typeof source.name === 'string');
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isOengusSchedule(source) {
    return (typeof source.id === 'number' && source.lines !== undefined);
}
/**
 * Resets the replicant's values to default.
 */
function resetImportStatus() {
    importStatus.value.importing = false;
    importStatus.value.item = 0;
    importStatus.value.total = 0;
    nodecg.log.debug('[Oengus Import] Import status restored to default');
}
/**
 * Import schedule data in from Oengus.
 * @param marathonShort Oengus' marathon shortname you want to import.
 * @param useJapanese If you want to use usernameJapanese from the user data.
 */
function importSchedule(marathonShort, useJapanese) {
    return __awaiter(this, void 0, void 0, function () {
        var marathonResp, scheduleResp, oengusLines, scheduledTime_1, newRunDataArray, err_2;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    importStatus.value.importing = true;
                    return [4 /*yield*/, get("/marathon/" + marathonShort)];
                case 1:
                    marathonResp = _a.sent();
                    return [4 /*yield*/, get("/marathon/" + marathonShort + "/schedule")];
                case 2:
                    scheduleResp = _a.sent();
                    if (!isOengusMarathon(marathonResp.body)) {
                        throw new Error('Did not receive marathon data correctly');
                    }
                    if (!isOengusSchedule(scheduleResp.body)) {
                        throw new Error('Did not receive schedule data correctly');
                    }
                    defaultSetupTime.value = iso8601_duration_1.toSeconds(iso8601_duration_1.parse(marathonResp.body.defaultSetupTime));
                    oengusLines = scheduleResp.body.lines;
                    scheduledTime_1 = Math.floor(Date.parse(marathonResp.body.startDate) / 1000);
                    return [4 /*yield*/, p_iteration_1.mapSeries(oengusLines.filter(function (line) { return (!helpers_1.checkGameAgainstIgnoreList(line.gameName)); }), function (line, index, arr) { return __awaiter(_this, void 0, void 0, function () {
                            var matchingOldRun, runData, parsedEstimate, parsedSetup, srcomGameTwitch, gameTwitch, _i, _a, str, _b;
                            var _c, _d;
                            var _this = this;
                            var _e, _f, _g, _h;
                            return __generator(this, function (_j) {
                                switch (_j.label) {
                                    case 0:
                                        importStatus.value.item = index + 1;
                                        importStatus.value.total = arr.length;
                                        matchingOldRun = runDataArray.value
                                            .find(function (oldRun) { return oldRun.externalID === line.id.toString(); });
                                        runData = {
                                            teams: [],
                                            customData: {},
                                            id: (_e = matchingOldRun === null || matchingOldRun === void 0 ? void 0 : matchingOldRun.id) !== null && _e !== void 0 ? _e : uuid_1.v4(),
                                            externalID: line.id.toString(),
                                        };
                                        // General Run Data
                                        runData.game = (_f = line.gameName) !== null && _f !== void 0 ? _f : undefined;
                                        runData.system = (_g = line.console) !== null && _g !== void 0 ? _g : undefined;
                                        runData.category = (_h = line.categoryName) !== null && _h !== void 0 ? _h : undefined;
                                        parsedEstimate = iso8601_duration_1.parse(line.estimate);
                                        runData.estimate = formatDuration(parsedEstimate);
                                        runData.estimateS = iso8601_duration_1.toSeconds(parsedEstimate);
                                        parsedSetup = iso8601_duration_1.parse(line.setupTime);
                                        runData.setupTime = formatDuration(parsedSetup);
                                        runData.setupTimeS = iso8601_duration_1.toSeconds(parsedSetup);
                                        if (!line.setupBlock) return [3 /*break*/, 1];
                                        // Game name set to "Setup" if the line is a setup block.
                                        runData.game = 'Setup';
                                        // Estimate for a setup block will be the setup time instead.
                                        runData.estimate = runData.setupTime;
                                        runData.estimateS = runData.setupTimeS;
                                        runData.setupTime = formatDuration({ seconds: 0 });
                                        runData.setupTimeS = 0;
                                        return [3 /*break*/, 8];
                                    case 1:
                                        if (!line.gameName) return [3 /*break*/, 8];
                                        srcomGameTwitch = void 0;
                                        if (!!config.oengus.disableSpeedrunComLookup) return [3 /*break*/, 3];
                                        return [4 /*yield*/, helpers_1.to(srcom_api_1.searchForTwitchGame(line.gameName))];
                                    case 2:
                                        _c = _j.sent(), srcomGameTwitch = _c[1];
                                        _j.label = 3;
                                    case 3:
                                        gameTwitch = void 0;
                                        _i = 0, _a = [srcomGameTwitch, line.gameName];
                                        _j.label = 4;
                                    case 4:
                                        if (!(_i < _a.length)) return [3 /*break*/, 7];
                                        str = _a[_i];
                                        if (!str) return [3 /*break*/, 6];
                                        return [4 /*yield*/, helpers_1.to(twitch_api_1.verifyTwitchDir(str))];
                                    case 5:
                                        _d = _j.sent(), gameTwitch = _d[1];
                                        if (gameTwitch) {
                                            return [3 /*break*/, 7]; // If a directory was successfully found, stop loop early.
                                        }
                                        _j.label = 6;
                                    case 6:
                                        _i++;
                                        return [3 /*break*/, 4];
                                    case 7:
                                        runData.gameTwitch = gameTwitch;
                                        _j.label = 8;
                                    case 8:
                                        // Add the scheduled time then update the value above for the next run.
                                        runData.scheduled = new Date(scheduledTime_1 * 1000).toISOString();
                                        runData.scheduledS = scheduledTime_1;
                                        scheduledTime_1 += runData.estimateS + runData.setupTimeS;
                                        // Team Data
                                        _b = runData;
                                        return [4 /*yield*/, p_iteration_1.mapSeries(line.runners, function (runner) { return __awaiter(_this, void 0, void 0, function () {
                                                var team, player, data, tURL;
                                                var _a;
                                                return __generator(this, function (_b) {
                                                    switch (_b.label) {
                                                        case 0:
                                                            team = {
                                                                id: uuid_1.v4(),
                                                                players: [],
                                                            };
                                                            player = {
                                                                name: (useJapanese && runner.usernameJapanese)
                                                                    ? runner.usernameJapanese : runner.username,
                                                                id: uuid_1.v4(),
                                                                teamID: team.id,
                                                                social: {
                                                                    twitch: (_a = runner.twitchName) !== null && _a !== void 0 ? _a : undefined,
                                                                },
                                                            };
                                                            if (!!config.oengus.disableSpeedrunComLookup) return [3 /*break*/, 2];
                                                            return [4 /*yield*/, srcom_api_1.searchForUserDataMultiple(runner.speedruncomName, runner.twitchName, runner.username)];
                                                        case 1:
                                                            data = _b.sent();
                                                            if (data) {
                                                                // Always favour the supplied Twitch username from schedule if available.
                                                                if (!runner.twitchName) {
                                                                    tURL = (data.twitch && data.twitch.uri) ? data.twitch.uri : undefined;
                                                                    player.social.twitch = helpers_1.getTwitchUserFromURL(tURL);
                                                                }
                                                                player.country = (data.location) ? data.location.country.code : undefined;
                                                            }
                                                            _b.label = 2;
                                                        case 2:
                                                            team.players.push(player);
                                                            return [2 /*return*/, team];
                                                    }
                                                });
                                            }); })];
                                    case 9:
                                        // Team Data
                                        _b.teams = _j.sent();
                                        return [2 /*return*/, runData];
                                }
                            });
                        }); })];
                case 3:
                    newRunDataArray = _a.sent();
                    runDataArray.value = newRunDataArray;
                    resetImportStatus();
                    return [3 /*break*/, 5];
                case 4:
                    err_2 = _a.sent();
                    resetImportStatus();
                    throw err_2;
                case 5: return [2 /*return*/];
            }
        });
    });
}
nodecg.listenFor('importOengusSchedule', function (data, ack) { return __awaiter(void 0, void 0, void 0, function () {
    var err_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                if (importStatus.value.importing) {
                    throw new Error('Already importing schedule');
                }
                nodecg.log.info('[Oengus Import] Started importing schedule');
                return [4 /*yield*/, importSchedule(data.marathonShort, data.useJapanese)];
            case 1:
                _a.sent();
                nodecg.log.info('[Oengus Import] Successfully imported schedule from Oengus');
                helpers_1.processAck(ack, null);
                return [3 /*break*/, 3];
            case 2:
                err_3 = _a.sent();
                nodecg.log.warn('[Oengus Import] Error importing schedule:', err_3);
                helpers_1.processAck(ack, err_3);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
