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
var clone_1 = __importDefault(require("clone"));
var lodash_1 = __importDefault(require("lodash"));
var events = __importStar(require("./util/events"));
var helpers_1 = __importDefault(require("./util/helpers"));
var timeStrToMS = helpers_1.default.timeStrToMS, msToTimeStr = helpers_1.default.msToTimeStr, cgListenForHelper = helpers_1.default.cgListenForHelper, formPlayerNamesStr = helpers_1.default.formPlayerNamesStr, getTwitchChannels = helpers_1.default.getTwitchChannels, to = helpers_1.default.to;
var RunControl = /** @class */ (function () {
    /* eslint-enable */
    function RunControl(nodecg) {
        var _this = this;
        this.nodecg = nodecg;
        this.h = new helpers_1.default(nodecg);
        this.array = this.nodecg.Replicant('runDataArray');
        this.activeRun = this.nodecg.Replicant('runDataActiveRun');
        this.activeRunSurrounding = this.nodecg.Replicant('runDataActiveRunSurrounding');
        this.timer = this.nodecg.Replicant('timer');
        this.twitchAPIData = this.nodecg.Replicant('twitchAPIData');
        // NodeCG messaging system.
        this.nodecg.listenFor('changeActiveRun', function (data, ack) {
            cgListenForHelper(_this.changeActiveRun(data), ack);
        });
        this.nodecg.listenFor('removeRun', function (data, ack) {
            cgListenForHelper(_this.removeRun(data), ack);
        });
        this.nodecg.listenFor('modifyRun', function (data, ack) {
            cgListenForHelper(_this.modifyRun(data.runData, data.prevID), ack);
        });
        this.nodecg.listenFor('changeToNextRun', function (data, ack) {
            cgListenForHelper(_this.changeActiveRun(_this.activeRunSurrounding.value.next), ack);
        });
        this.nodecg.listenFor('returnToStart', function (data, ack) {
            cgListenForHelper(_this.removeActiveRun(), ack);
        });
        this.nodecg.listenFor('removeAllRuns', function (data, ack) {
            cgListenForHelper(_this.removeAllRuns(), ack);
        });
        this.nodecg.listenFor('removeAllRuns', function (data, ack) {
            cgListenForHelper(_this.removeAllRuns(), ack);
        });
        this.activeRun.on('change', function () { return _this.changeSurroundingRuns(); });
        this.array.on('change', function () { return _this.changeSurroundingRuns(); });
    }
    /**
     * Used to update the replicant that stores ID references to previous/current/next runs.
     */
    RunControl.prototype.changeSurroundingRuns = function () {
        var _a, _b, _c, _d;
        var previous;
        var current;
        var next;
        if (!this.activeRun.value) {
            // No current run set, we must be at the start, only set that one.
            next = this.array.value[0];
        }
        else {
            current = this.activeRun.value; // Current will always be the active one.
            // Try to find currently set runs in the run data array.
            var currentIndex = this.h.findRunIndexFromId(current.id);
            var previousIndex = this.h.findRunIndexFromId(this.activeRunSurrounding.value.previous);
            var nextIndex = this.h.findRunIndexFromId(this.activeRunSurrounding.value.next);
            if (currentIndex >= 0) { // Found current run in array.
                if (currentIndex > 0) {
                    _a = this.array.value.slice(currentIndex - 1), previous = _a[0], next = _a[2];
                }
                else { // We're at the start and can't splice -1.
                    _b = this.array.value.slice(0), next = _b[1];
                }
            }
            else if (previousIndex >= 0) { // Found previous run in array, use for reference.
                _c = this.array.value.slice(previousIndex), previous = _c[0], next = _c[2];
            }
            else if (nextIndex >= 0) { // Found next run in array, use for reference.
                _d = this.array.value.slice(nextIndex - 2), previous = _d[0], next = _d[2];
            }
        }
        this.activeRunSurrounding.value = {
            previous: (previous) ? previous.id : undefined,
            current: (current) ? current.id : undefined,
            next: (next) ? next.id : undefined,
        };
    };
    /**
     * Change the active run to the one specified if it exists.
     * @param id The unique ID of the run you wish to change to.
     */
    RunControl.prototype.changeActiveRun = function (id) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var runData, status_1, game, _a;
            var _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        runData = this.array.value.find(function (run) { return run.id === id; });
                        if (!['running', 'paused'].includes(this.timer.value.state)) return [3 /*break*/, 1];
                        reject(new Error('Cannot change run while timer is running/paused.'));
                        return [3 /*break*/, 8];
                    case 1:
                        if (!runData) return [3 /*break*/, 7];
                        if (!this.twitchAPIData.value.sync) return [3 /*break*/, 6];
                        status_1 = this.h.bundleConfig().twitch.streamTitle
                            .replace(new RegExp('{{game}}', 'g'), runData.game || '')
                            .replace(new RegExp('{{players}}', 'g'), formPlayerNamesStr(runData))
                            .replace(new RegExp('{{category}}', 'g'), runData.category || '');
                        game = runData.gameTwitch;
                        if (!(!game)) return [3 /*break*/, 3];
                        return [4 /*yield*/, to(events.sendMessage('srcomTwitchGameSearch', runData.game))];
                    case 2:
                        _a = _d.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = [null, game];
                        _d.label = 4;
                    case 4:
                        _b = _a, game = _b[1];
                        return [4 /*yield*/, to(events.sendMessage('twitchGameSearch', game))];
                    case 5:
                        _c = _d.sent(), game = _c[1];
                        game = game || this.h.bundleConfig().twitch.streamDefaultGame;
                        to(events.sendMessage('twitchUpdateChannelInfo', { status: status_1, game: game }));
                        // Construct/send featured channels if enabled.
                        if (this.h.bundleConfig().twitch.ffzIntegration) {
                            to(events.sendMessage('ffzUpdateFeaturedChannels', getTwitchChannels(runData)));
                        }
                        _d.label = 6;
                    case 6:
                        this.activeRun.value = clone_1.default(runData);
                        this.nodecg.sendMessage('timerReset');
                        resolve();
                        return [3 /*break*/, 8];
                    case 7:
                        if (!id) {
                            reject(new Error('Cannot change run as no run ID was supplied.'));
                        }
                        else {
                            reject(new Error("Cannot change run as a run with ID " + id + " was not found."));
                        }
                        _d.label = 8;
                    case 8: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * Deletes a run from the run data array.
     * @param id The unique ID of the run you wish to delete.
     */
    RunControl.prototype.removeRun = function (id) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var runIndex = _this.array.value.findIndex(function (run) { return run.id === id; });
            if (runIndex >= 0) {
                _this.array.value.splice(runIndex, 1);
                resolve();
            }
            else if (!id) {
                reject(new Error('Cannot delete run as no run ID was supplied.'));
            }
            else {
                reject(new Error("Cannot delete run as a run with ID " + id + " was not found."));
            }
        });
    };
    /**
     * Either edits a run (if we currently have it) or adds it.
     * @param runData Run Data object.
     * @param prevID ID of the run that this run will be inserted after if applicable.
     */
    RunControl.prototype.modifyRun = function (runData, prevID) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // Loops through data, removes any keys that are falsey.
            var data = lodash_1.default.pickBy(runData, lodash_1.default.identity);
            data.customData = lodash_1.default.pickBy(data.customData, lodash_1.default.identity);
            data.teams = data.teams.map(function (team) {
                var teamData = lodash_1.default.pickBy(team, lodash_1.default.identity);
                teamData.players = teamData.players.map(function (player) {
                    var playerData = lodash_1.default.pickBy(player, lodash_1.default.identity);
                    playerData.social = lodash_1.default.pickBy(playerData.social, lodash_1.default.identity);
                    return playerData;
                });
                return teamData;
            });
            // Check all teams have players, if not throw an error.
            if (!data.teams.every(function (team) { return !!team.players.length; })) {
                reject(new Error('Cannot accept run data as team(s) are missing player(s).'));
                return;
            }
            // Check all players have names, if not throw an error.
            var allNamesAdded = data.teams.every(function (team) { return (team.players.every(function (player) { return !!player.name; })); });
            if (!allNamesAdded) {
                reject(new Error('Cannot accept run data as player(s) are missing name(s).'));
                return;
            }
            // Verify and convert estimate.
            if (data.estimate) {
                if (data.estimate.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
                    var ms = timeStrToMS(data.estimate);
                    data.estimate = msToTimeStr(ms);
                    data.estimateS = ms / 1000;
                }
                else { // Throw error if format is incorrect.
                    reject(new Error('Cannot accept run data as estimate is in incorrect format.'));
                    return;
                }
            }
            else {
                delete data.estimate;
                delete data.estimateS;
            }
            // Verify and convert setup time.
            if (data.setupTime) {
                if (data.setupTime.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
                    var ms = timeStrToMS(data.setupTime);
                    data.setupTime = msToTimeStr(ms);
                    data.setupTimeS = ms / 1000;
                }
                else { // Throw error if format is incorrect.
                    reject(new Error('Cannot accept run data as setup time is in incorrect format.'));
                    return;
                }
            }
            else {
                delete data.setupTime;
                delete data.setupTimeS;
            }
            var index = _this.h.findRunIndexFromId(data.id);
            if (index >= 0) { // Run already exists, edit it.
                if (_this.activeRun.value && data.id === _this.activeRun.value.id) {
                    _this.activeRun.value = clone_1.default(data);
                }
                _this.array.value[index] = clone_1.default(data);
            }
            else { // Run is new, add it.
                var prevIndex = _this.h.findRunIndexFromId(prevID);
                _this.array.value.splice(prevIndex + 1 || _this.array.value.length, 0, clone_1.default(data));
            }
            resolve();
        });
    };
    /**
     * Removes the active run from the relevant replicant.
     */
    RunControl.prototype.removeActiveRun = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (['running', 'paused'].includes(_this.timer.value.state)) {
                reject(new Error('Cannot change run while timer is running/paused.'));
            }
            else {
                _this.activeRun.value = null;
                _this.nodecg.sendMessage('timerReset');
                resolve();
            }
        });
    };
    /**
     * Removes all runs in the array and the currently active run.
     */
    RunControl.prototype.removeAllRuns = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (['running', 'paused'].includes(_this.timer.value.state)) {
                reject(new Error('Cannot remove all runs while timer is running/paused.'));
            }
            else {
                _this.array.value.length = 0;
                _this.removeActiveRun();
                _this.nodecg.sendMessage('timerReset');
                resolve();
            }
        });
    };
    return RunControl;
}());
exports.default = RunControl;
