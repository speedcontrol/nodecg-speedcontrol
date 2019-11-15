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
var crypto_1 = __importDefault(require("crypto"));
var lodash_1 = __importDefault(require("lodash"));
var markdown_it_1 = __importDefault(require("markdown-it"));
var needle_1 = __importDefault(require("needle"));
var p_iteration_1 = require("p-iteration");
var parse_duration_1 = __importDefault(require("parse-duration"));
var remove_markdown_1 = __importDefault(require("remove-markdown"));
var v4_1 = __importDefault(require("uuid/v4"));
var srcom_api_1 = require("./srcom-api");
var twitch_api_1 = require("./twitch-api");
var helpers_1 = require("./util/helpers"); // eslint-disable-line object-curly-newline, max-len
var nodecg_1 = require("./util/nodecg");
var nodecg = nodecg_1.get();
var config = helpers_1.bundleConfig();
var md = new markdown_it_1.default();
var runDataArray = nodecg.Replicant('runDataArray');
var importStatus = nodecg.Replicant('horaroImportStatus', {
    persistent: false,
});
var defaultSetupTime = nodecg.Replicant('defaultSetupTime');
var scheduleDataCache = {};
/**
 * Used to parse Markdown from schedules.
 * Returns URL of first link and a string with all formatting removed.
 * Will return both undefined if nothing is supplied.
 * @param str Markdowned string you wish to parse.
 */
function parseMarkdown(str) {
    var results = {};
    if (!str) {
        return results;
    }
    // Some stuff can break this, so try/catching it if needed.
    try {
        var res = md.parseInline(str, {});
        var url = res[0].children.find(function (child) { return (child.type === 'link_open' && child.attrs[0] && child.attrs[0][0] === 'href'); });
        results.url = (url) ? url.attrs[0][1] : undefined;
        results.str = remove_markdown_1.default(str);
        return results;
    }
    catch (err) {
        return results;
    }
}
/**
 * Used to look up a user's data on speedrun.com with an arbitrary string,
 * usually name or Twitch username. If nothing is specified, will resolve immediately.
 * @param str String to attempt to look up the user by.
 */
function querySRcomUserData(str) {
    return __awaiter(this, void 0, void 0, function () {
        var data, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(str && !config.schedule.disableSpeedrunComLookup)) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, srcom_api_1.searchForUserData(str)];
                case 2:
                    data = _a.sent();
                    return [2 /*return*/, data];
                case 3:
                    err_1 = _a.sent();
                    return [2 /*return*/, undefined];
                case 4: return [2 /*return*/, undefined];
            }
        });
    });
}
/**
 * Attempt to get information about a player using several options.
 * @param name Name to attempt to use.
 * @param twitchURL Twitch URL to attempt to use.
 */
function parseSRcomUserData(name, twitchURL) {
    return __awaiter(this, void 0, void 0, function () {
        var foundData, twitchUsername, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    foundData = {};
                    twitchUsername = (twitchURL && twitchURL.includes('twitch.tv')) ? twitchURL.split('/')[twitchURL.split('/').length - 1] : undefined;
                    return [4 /*yield*/, querySRcomUserData(twitchUsername)];
                case 1:
                    data = _a.sent();
                    if (!!data) return [3 /*break*/, 3];
                    return [4 /*yield*/, querySRcomUserData(name)];
                case 2:
                    data = _a.sent();
                    _a.label = 3;
                case 3:
                    // Parse data if possible.
                    if (data) {
                        foundData.country = (data.location) ? data.location.country.code : undefined;
                        foundData.twitchURL = (data.twitch && data.twitch.uri) ? data.twitch.uri : undefined;
                    }
                    return [2 /*return*/, foundData];
            }
        });
    });
}
/**
 * Generates a hash based on the contents of the string based run data from Horaro.
 * @param colData Array of strings (or nulls), obtained from the Horaro JSON data.
 */
function generateRunHash(colData) {
    return crypto_1.default.createHash('sha1').update(colData.join(), 'utf8').digest('hex');
}
/**
 * Checks if the game name appears in the ignore list in the configuration.
 * @param game Game string (or null) to check against.
 */
function checkGameAgainstIgnoreList(game) {
    if (!game) {
        return false;
    }
    var list = config.schedule.ignoreGamesWhileImporting || [];
    return !!list.find(function (str) { return !!str.toLowerCase().match(new RegExp("\\b" + lodash_1.default.escapeRegExp(game.toLowerCase()) + "\\b")); });
}
/**
 * Resets the replicant's values to default.
 */
function resetImportStatus() {
    importStatus.value.importing = false;
    importStatus.value.item = 0;
    importStatus.value.total = 0;
    nodecg.log.debug('[Horaro Import] Import status restored to default');
}
/**
 * Load schedule data in from Horaro, store in a temporary cache and return it.
 * @param url URL of Horaro schedule.
 * @param dashID UUID of dashboard element, generated on panel load and passed here.
 */
function loadSchedule(url, dashID) {
    return __awaiter(this, void 0, void 0, function () {
        var jsonURL, urlMatch, keyMatch, resp, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    jsonURL = url + ".json";
                    if (url.match((/\?key=/))) { // If schedule URL has a key in it, extract it correctly.
                        urlMatch = url.match(/(.*?)(?=(\?key=))/)[0];
                        keyMatch = url.match(/(?<=(\?key=))(.*?)$/)[0];
                        jsonURL = urlMatch + ".json?key=" + keyMatch;
                    }
                    return [4 /*yield*/, needle_1.default('get', encodeURI(jsonURL))];
                case 1:
                    resp = _a.sent();
                    if (resp.statusCode !== 200) {
                        throw new Error("HTTP status code was " + resp.statusCode);
                    }
                    scheduleDataCache[dashID] = resp.body;
                    nodecg.log.debug('[Horaro Import] Schedule successfully loaded');
                    return [2 /*return*/, resp.body];
                case 2:
                    err_2 = _a.sent();
                    nodecg.log.debug('[Horaro Import] Schedule could not be loaded:', err_2);
                    throw err_2;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Imports schedule data loaded in above function.
 * @param opts Options on how the schedule data should be parsed, including column numbers.
 * @param dashID UUID of dashboard element, generated on panel load and passed here.
 */
function importSchedule(optsO, dashID) {
    return __awaiter(this, void 0, void 0, function () {
        var data, runItems_1, setupTime_1, opts_1, hashesSeen_1, newRunDataArray, err_3;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    importStatus.value.importing = true;
                    data = scheduleDataCache[dashID];
                    runItems_1 = data.schedule.items;
                    setupTime_1 = data.schedule.setup_t;
                    defaultSetupTime.value = setupTime_1;
                    opts_1 = {
                        columns: {
                            game: (optsO.columns.game === null) ? -1 : optsO.columns.game,
                            gameTwitch: (optsO.columns.gameTwitch === null) ? -1 : optsO.columns.gameTwitch,
                            category: (optsO.columns.category === null) ? -1 : optsO.columns.category,
                            system: (optsO.columns.system === null) ? -1 : optsO.columns.system,
                            region: (optsO.columns.region === null) ? -1 : optsO.columns.region,
                            release: (optsO.columns.release === null) ? -1 : optsO.columns.release,
                            player: (optsO.columns.player === null) ? -1 : optsO.columns.player,
                            custom: {},
                        },
                        split: optsO.split,
                    };
                    Object.keys(optsO.columns.custom).forEach(function (col) {
                        var val = optsO.columns.custom[col];
                        opts_1.columns.custom[col] = (val === null) ? -1 : val;
                    });
                    hashesSeen_1 = [];
                    return [4 /*yield*/, p_iteration_1.mapSeries(runItems_1.filter(function (run) { return (!checkGameAgainstIgnoreList(run.data[opts_1.columns.game])); }), function (run, index, arr) { return __awaiter(_this, void 0, void 0, function () {
                            var hash, matchingOldRun, runData, game, gameTwitch, srcomGameTwitch, gameAbbr, runSetupTime, duration, playerList, teamSplittingRegex, teamsRaw, _a;
                            var _b, _c, _d;
                            var _this = this;
                            return __generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        importStatus.value.item = index + 1;
                                        importStatus.value.total = arr.length;
                                        hash = generateRunHash(run.data);
                                        if (!hashesSeen_1.includes(hash)) {
                                            matchingOldRun = runDataArray.value.find(function (oldRun) { return oldRun.hash === hash; });
                                            hashesSeen_1.push(hash);
                                        }
                                        runData = {
                                            teams: [],
                                            customData: {},
                                            id: (matchingOldRun) ? matchingOldRun.id : v4_1.default(),
                                            hash: hash,
                                        };
                                        // General Run Data
                                        runData.game = parseMarkdown(run.data[opts_1.columns.game]).str;
                                        runData.system = parseMarkdown(run.data[opts_1.columns.system]).str;
                                        runData.category = parseMarkdown(run.data[opts_1.columns.category]).str;
                                        runData.region = parseMarkdown(run.data[opts_1.columns.region]).str;
                                        runData.release = parseMarkdown(run.data[opts_1.columns.release]).str;
                                        game = parseMarkdown(run.data[opts_1.columns.game]);
                                        gameTwitch = parseMarkdown(run.data[opts_1.columns.gameTwitch]).str;
                                        if (!(!config.schedule.disableSpeedrunComLookup && !gameTwitch)) return [3 /*break*/, 4];
                                        if (!(game.url && game.url.includes('speedrun.com'))) return [3 /*break*/, 2];
                                        gameAbbr = game.url
                                            .split('speedrun.com/')[game.url.split('speedrun.com/').length - 1]
                                            .split('/')[0]
                                            .split('#')[0];
                                        return [4 /*yield*/, helpers_1.to(srcom_api_1.searchForTwitchGame(gameAbbr, true))];
                                    case 1:
                                        _b = _e.sent(), srcomGameTwitch = _b[1];
                                        _e.label = 2;
                                    case 2:
                                        if (!(!srcomGameTwitch && game.str)) return [3 /*break*/, 4];
                                        return [4 /*yield*/, helpers_1.to(srcom_api_1.searchForTwitchGame(game.str))];
                                    case 3:
                                        _c = _e.sent(), srcomGameTwitch = _c[1];
                                        _e.label = 4;
                                    case 4:
                                        gameTwitch = gameTwitch || srcomGameTwitch || game.str;
                                        if (!gameTwitch) return [3 /*break*/, 6];
                                        return [4 /*yield*/, helpers_1.to(twitch_api_1.verifyTwitchDir(gameTwitch))];
                                    case 5:
                                        _d = _e.sent(), gameTwitch = _d[1];
                                        _e.label = 6;
                                    case 6:
                                        runData.gameTwitch = gameTwitch;
                                        // Scheduled Date/Time
                                        runData.scheduledS = run.scheduled_t;
                                        runData.scheduled = run.scheduled;
                                        // Estimate
                                        runData.estimateS = run.length_t;
                                        runData.estimate = helpers_1.msToTimeStr(run.length_t * 1000);
                                        runSetupTime = setupTime_1 * 1000;
                                        if (run.options && run.options.setup) {
                                            duration = parse_duration_1.default(run.options.setup);
                                            if (duration > 0) {
                                                runSetupTime = duration;
                                            }
                                        }
                                        runData.setupTime = helpers_1.msToTimeStr(runSetupTime);
                                        runData.setupTimeS = runSetupTime / 1000;
                                        // Custom Data
                                        Object.keys(opts_1.columns.custom).forEach(function (col) {
                                            if (!config.schedule.customData) {
                                                return;
                                            }
                                            var colSetting = config.schedule.customData.find(function (setting) { return setting.key === col; });
                                            if (!colSetting) {
                                                return;
                                            }
                                            var colData = run.data[opts_1.columns.custom[col]];
                                            var str = (!colSetting.ignoreMarkdown) ? parseMarkdown(colData).str : colData;
                                            if (str) {
                                                runData.customData[col] = str;
                                            }
                                        });
                                        playerList = run.data[opts_1.columns.player];
                                        if (!playerList) return [3 /*break*/, 9];
                                        teamSplittingRegex = [
                                            /\s+vs\.?\s+/,
                                            /\s*,\s*/,
                                        ];
                                        return [4 /*yield*/, p_iteration_1.mapSeries(playerList.split(teamSplittingRegex[opts_1.split]), function (team) {
                                                var nameMatch = team.match(/^(.+)(?=:\s)/);
                                                return {
                                                    name: (nameMatch) ? nameMatch[0] : undefined,
                                                    players: (opts_1.split === 0)
                                                        ? team.replace(/^(.+)(:\s)/, '').split(/\s*,\s*/)
                                                        : [team.replace(/^(.+)(:\s)/, '')],
                                                };
                                            })];
                                    case 7:
                                        teamsRaw = _e.sent();
                                        // Mapping team information from above into needed format.
                                        _a = runData;
                                        return [4 /*yield*/, p_iteration_1.mapSeries(teamsRaw, function (rawTeam) { return __awaiter(_this, void 0, void 0, function () {
                                                var team, _a;
                                                var _this = this;
                                                return __generator(this, function (_b) {
                                                    switch (_b.label) {
                                                        case 0:
                                                            team = {
                                                                id: v4_1.default(),
                                                                name: parseMarkdown(rawTeam.name).str,
                                                                players: [],
                                                            };
                                                            // Mapping player information into needed format.
                                                            _a = team;
                                                            return [4 /*yield*/, p_iteration_1.mapSeries(rawTeam.players, function (rawPlayer) { return __awaiter(_this, void 0, void 0, function () {
                                                                    var _a, str, url, _b, country, twitchURL, usedURL;
                                                                    return __generator(this, function (_c) {
                                                                        switch (_c.label) {
                                                                            case 0:
                                                                                _a = parseMarkdown(rawPlayer), str = _a.str, url = _a.url;
                                                                                return [4 /*yield*/, parseSRcomUserData(str, url)];
                                                                            case 1:
                                                                                _b = _c.sent(), country = _b.country, twitchURL = _b.twitchURL;
                                                                                usedURL = url || twitchURL;
                                                                                return [2 /*return*/, {
                                                                                        name: str || '',
                                                                                        id: v4_1.default(),
                                                                                        teamID: team.id,
                                                                                        country: country,
                                                                                        social: {
                                                                                            twitch: (usedURL && usedURL.includes('twitch.tv')) ? usedURL.split('/')[usedURL.split('/').length - 1] : undefined,
                                                                                        },
                                                                                    }];
                                                                        }
                                                                    });
                                                                }); })];
                                                        case 1:
                                                            // Mapping player information into needed format.
                                                            _a.players = _b.sent();
                                                            return [2 /*return*/, team];
                                                    }
                                                });
                                            }); })];
                                    case 8:
                                        // Mapping team information from above into needed format.
                                        _a.teams = _e.sent();
                                        _e.label = 9;
                                    case 9:
                                        nodecg.log.debug("[Horaro Import] Successfully imported " + (index + 1) + "/" + runItems_1.length);
                                        return [2 /*return*/, runData];
                                }
                            });
                        }); })];
                case 1:
                    newRunDataArray = _a.sent();
                    runDataArray.value = newRunDataArray;
                    resetImportStatus();
                    return [3 /*break*/, 3];
                case 2:
                    err_3 = _a.sent();
                    resetImportStatus();
                    throw err_3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
nodecg.listenFor('loadSchedule', function (data, ack) {
    loadSchedule(data.url, data.dashID)
        .then(function (data_) { return helpers_1.processAck(ack, null, data_); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
nodecg.listenFor('importSchedule', function (data, ack) {
    try {
        if (importStatus.value.importing) {
            throw new Error('Already importing schedule');
        }
        nodecg.log.info('[Horaro Import] Started importing schedule');
        importSchedule(data.opts, data.dashID)
            .then(function () {
            nodecg.log.info('[Horaro Import] Successfully imported schedule');
            helpers_1.processAck(ack, null);
        });
    }
    catch (err) {
        nodecg.log.warn('[Horaro Import] Error importing schedule:', err);
        helpers_1.processAck(ack, err);
    }
});
