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
var crypto_1 = __importDefault(require("crypto"));
var lodash_1 = __importDefault(require("lodash"));
var markdown_it_1 = __importDefault(require("markdown-it"));
var needle_1 = __importDefault(require("needle"));
var p_iteration_1 = require("p-iteration");
var parse_duration_1 = __importDefault(require("parse-duration"));
var remove_markdown_1 = __importDefault(require("remove-markdown"));
var v4_1 = __importDefault(require("uuid/v4"));
var events = __importStar(require("./util/events"));
var helpers_1 = __importDefault(require("./util/helpers"));
var msToTimeStr = helpers_1.default.msToTimeStr, nullToUndefined = helpers_1.default.nullToUndefined, nullToNegOne = helpers_1.default.nullToNegOne, sleep = helpers_1.default.sleep, processAck = helpers_1.default.processAck;
var HoraroImport = /** @class */ (function () {
    /* eslint-enable */
    function HoraroImport(nodecg) {
        var _this = this;
        this.md = new markdown_it_1.default();
        this.scheduleDataCache = {};
        this.nodecg = nodecg;
        this.h = new helpers_1.default(nodecg);
        this.config = this.h.bundleConfig();
        this.runDataArray = nodecg.Replicant('runDataArray');
        this.importStatus = nodecg.Replicant('horaroImportStatus', { persistent: false });
        this.defaultSetupTime = nodecg.Replicant('defaultSetupTime');
        this.nodecg.listenFor('loadSchedule', function (opts, ack) {
            _this.loadSchedule(opts.url, opts.dashUUID).then(function (data) {
                processAck(null, ack, data);
            }).catch(function (err) {
                processAck(err, ack);
            });
        });
        this.nodecg.listenFor('importSchedule', function (opts, ack) {
            try {
                if (_this.importStatus.value.importing) {
                    throw new Error('Cannot import schedule as a schedule is already being imported.');
                }
                _this.nodecg.log.info('Started importing Horaro schedule.');
                _this.importSchedule(opts.opts, opts.dashUUID).then(function () {
                    _this.nodecg.log.info('Successfully imported Horaro schedule.');
                    processAck(null, ack);
                }).catch(function (err) {
                    throw err;
                });
            }
            catch (err) {
                _this.nodecg.log.warn('Error importing Horaro schedule:', err);
                processAck(err, ack);
            }
        });
    }
    /**
     * Load schedule data in from Horaro, store in a temporary cache and return it.
     * @param url URL of Horaro schedule.
     * @param dashUUID UUID of dashboard element, generated on panel load and passed here.
     */
    HoraroImport.prototype.loadSchedule = function (url, dashUUID) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var jsonURL, urlMatch, keyMatch, resp, err_1;
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
                            throw new Error('Cannot load schedule as HTTP status code was not 200.');
                        }
                        this.scheduleDataCache[dashUUID] = resp.body;
                        resolve(resp.body);
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _a.sent();
                        reject(err_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * Imports schedule data loaded in above function.
     * @param opts Options on how the schedule data should be parsed, including column numbers.
     * @param dashUUID UUID of dashboard element, generated on panel load and passed here.
     */
    HoraroImport.prototype.importSchedule = function (opts, dashUUID) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var data, runItems_1, setupTime_1, newRunDataArray, err_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.importStatus.value.importing = true;
                        data = this.scheduleDataCache[dashUUID];
                        runItems_1 = data.schedule.items;
                        setupTime_1 = data.schedule.setup_t;
                        this.defaultSetupTime.value = setupTime_1;
                        return [4 /*yield*/, p_iteration_1.mapSeries(runItems_1.filter(function (run) { return (!_this.checkGameAgainstIgnoreList(run.data[nullToNegOne(opts.columns.game)])); }), function (run, index, arr) { return __awaiter(_this, void 0, void 0, function () {
                                var hash, matchingOldRun, runData, generalDataList, runSetupTime, duration, playerList, teamSplittingRegex, teamsRaw, _a;
                                var _this = this;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            this.importStatus.value.item = index + 1;
                                            this.importStatus.value.total = arr.length;
                                            hash = HoraroImport.generateRunHash(run.data);
                                            matchingOldRun = this.runDataArray.value.find(function (oldRun) { return oldRun.hash === hash; });
                                            runData = {
                                                teams: [],
                                                customData: {},
                                                id: (matchingOldRun) ? matchingOldRun.id : v4_1.default(),
                                                hash: hash,
                                            };
                                            generalDataList = ['game', 'gameTwitch', 'system', 'category', 'region', 'release'];
                                            generalDataList.forEach(function (type) {
                                                // @ts-ignore: double check the list above and make sure they are on RunData!
                                                runData[type] = _this.parseMarkdown(nullToUndefined(run.data[nullToNegOne(
                                                // @ts-ignore: same as above
                                                opts.columns[type])])).str;
                                            });
                                            // Scheduled Date/Time
                                            runData.scheduledS = run.scheduled_t;
                                            runData.scheduled = run.scheduled;
                                            // Estimate
                                            runData.estimateS = run.length_t;
                                            runData.estimate = msToTimeStr(run.length_t * 1000);
                                            runSetupTime = setupTime_1 * 1000;
                                            if (run.options && run.options.setup) {
                                                duration = parse_duration_1.default(run.options.setup);
                                                if (duration > 0) {
                                                    runSetupTime = duration;
                                                }
                                            }
                                            runData.setupTime = msToTimeStr(runSetupTime);
                                            runData.setupTimeS = runSetupTime / 1000;
                                            // Custom Data
                                            Object.keys(opts.columns.custom).forEach(function (col) {
                                                var str = _this.parseMarkdown(nullToUndefined(run.data[nullToNegOne(opts.columns.custom[col])])).str;
                                                if (str) {
                                                    runData.customData[col] = str;
                                                }
                                            });
                                            if (!run.data[nullToNegOne(opts.columns.player)]) return [3 /*break*/, 3];
                                            playerList = nullToUndefined(run.data[nullToNegOne(opts.columns.player)]);
                                            teamSplittingRegex = [
                                                /\s+vs\.?\s+/,
                                                /\s*,\s*/,
                                            ];
                                            return [4 /*yield*/, p_iteration_1.mapSeries(playerList.split(teamSplittingRegex[opts.split]), function (team) {
                                                    var nameMatch = team.match(/^(.+)(?=:\s)/);
                                                    return {
                                                        name: (nameMatch) ? nameMatch[0] : undefined,
                                                        players: (opts.split === 0)
                                                            ? team.replace(/^(.+)(:\s)/, '').split(/\s*,\s*/) : [team.replace(/^(.+)(:\s)/, '')],
                                                    };
                                                })];
                                        case 1:
                                            teamsRaw = _b.sent();
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
                                                                    name: this.parseMarkdown(rawTeam.name).str,
                                                                    players: [],
                                                                };
                                                                // Mapping player information into needed format.
                                                                _a = team;
                                                                return [4 /*yield*/, p_iteration_1.mapSeries(rawTeam.players, function (rawPlayer) { return __awaiter(_this, void 0, void 0, function () {
                                                                        var _a, str, url, _b, country, twitchURL, usedURL;
                                                                        return __generator(this, function (_c) {
                                                                            switch (_c.label) {
                                                                                case 0:
                                                                                    _a = this.parseMarkdown(rawPlayer), str = _a.str, url = _a.url;
                                                                                    return [4 /*yield*/, this.parseSRcomUserData(str, url)];
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
                                        case 2:
                                            // Mapping team information from above into needed format.
                                            _a.teams = _b.sent();
                                            _b.label = 3;
                                        case 3:
                                            this.nodecg.log.debug('Horaro Schedule Import: Successfully imported %s/%s.', index + 1, runItems_1.length);
                                            return [2 /*return*/, runData];
                                    }
                                });
                            }); })];
                    case 1:
                        newRunDataArray = _a.sent();
                        this.runDataArray.value = newRunDataArray;
                        this.resetImportStatus();
                        resolve();
                        return [3 /*break*/, 3];
                    case 2:
                        err_2 = _a.sent();
                        this.resetImportStatus();
                        reject(err_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * Used to parse Markdown from schedules.
     * Currently returns URL of first link and a string with all formatting removed.
     * Will return both undefined if nothing is supplied.
     * @param str Markdowned string you wish to parse.
     */
    HoraroImport.prototype.parseMarkdown = function (str) {
        var results = {};
        if (!str) {
            return results;
        }
        // Some stuff can break this, so try/catching it if needed.
        try {
            var res = this.md.parseInline(str, {});
            var url = res[0].children.find(function (child) { return (child.type === 'link_open' && child.attrs[0] && child.attrs[0][0] === 'href'); });
            results.url = (url) ? url.attrs[0][1] : undefined;
            results.str = remove_markdown_1.default(str);
            return results;
        }
        catch (err) {
            return results;
        }
    };
    /**
     * Used to look up a user's data on speedrun.com with an arbitrary string,
     * usually name or Twitch username. If nothing is specified, will resolve immediately.
     * @param str String to attempt to look up the user by.
     */
    HoraroImport.prototype.querySRcomUserData = function (str) {
        var _this = this;
        return new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
            var data, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(!str || this.config.schedule.disableSpeedrunComLookup)) return [3 /*break*/, 1];
                        resolve();
                        return [3 /*break*/, 5];
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, sleep(1000)];
                    case 2:
                        _a.sent(); // this slows it down even if it's in cache, needs fixing
                        return [4 /*yield*/, events.sendMessage('srcomUserSearch', str)];
                    case 3:
                        data = _a.sent();
                        resolve(data);
                        return [3 /*break*/, 5];
                    case 4:
                        err_3 = _a.sent();
                        resolve(); // If nothing found, currently just resolve.
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * Attempt to get information about a player using several options.
     * @param name Name to attempt to use.
     * @param twitchURL Twitch URL to attempt to use.
     */
    HoraroImport.prototype.parseSRcomUserData = function (name, twitchURL) {
        var _this = this;
        return new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
            var foundData, twitchUsername, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        foundData = {};
                        twitchUsername = (twitchURL && twitchURL.includes('twitch.tv')) ? twitchURL.split('/')[twitchURL.split('/').length - 1] : undefined;
                        return [4 /*yield*/, this.querySRcomUserData(twitchUsername)];
                    case 1:
                        data = _a.sent();
                        if (!!data) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.querySRcomUserData(name)];
                    case 2:
                        data = _a.sent();
                        _a.label = 3;
                    case 3:
                        // Parse data if possible.
                        if (data) {
                            foundData.country = (data.location) ? data.location.country.code : undefined;
                            foundData.twitchURL = (data.twitch && data.twitch.uri) ? data.twitch.uri : undefined;
                        }
                        resolve(foundData);
                        return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * Generates a hash based on the contents of the string based run data from Horaro.
     * @param colData Array of strings (or nulls), obtained from the Horaro JSON data.
     */
    HoraroImport.generateRunHash = function (colData) {
        return crypto_1.default.createHash('sha1').update(colData.join(), 'utf8').digest('hex');
    };
    /**
     * Checks if the game name appears in the ignore list in the configuration.
     * @param game Game string (or null) to check against.
     */
    HoraroImport.prototype.checkGameAgainstIgnoreList = function (game) {
        if (!game) {
            return false;
        }
        var list = this.config.schedule.ignoreGamesWhileImporting || [];
        return !!list.find(function (str) { return !!str.toLowerCase().match(new RegExp("\\b" + lodash_1.default.escapeRegExp(game.toLowerCase()) + "\\b")); });
    };
    /**
   * Resets the replicant's values to default.
   */
    HoraroImport.prototype.resetImportStatus = function () {
        this.importStatus.value.importing = false;
        this.importStatus.value.item = 0;
        this.importStatus.value.total = 0;
    };
    return HoraroImport;
}());
exports.default = HoraroImport;
