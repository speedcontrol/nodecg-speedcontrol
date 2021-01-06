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
var ffz_ws_1 = require("./ffz-ws");
var srcom_api_1 = require("./srcom-api");
var timer_1 = require("./timer");
var twitch_api_1 = require("./twitch-api");
var events = __importStar(require("./util/events"));
var helpers_1 = require("./util/helpers"); // eslint-disable-line object-curly-newline, max-len
var nodecg_1 = require("./util/nodecg");
var nodecg = nodecg_1.get();
var array = nodecg.Replicant('runDataArray');
var activeRun = nodecg.Replicant('runDataActiveRun');
var activeRunSurr = nodecg.Replicant('runDataActiveRunSurrounding');
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: persistenceInterval not typed yet
var timer = nodecg.Replicant('timer', { persistenceInterval: 1000 });
var twitchAPIData = nodecg.Replicant('twitchAPIData');
/**
 * Used to update the replicant that stores ID references to previous/current/next runs.
 */
function changeSurroundingRuns() {
    var _a, _b, _c, _d;
    var previous;
    var current;
    var next;
    if (!activeRun.value) {
        // No current run set, we must be at the start, only set that one.
        next = array.value[0];
    }
    else {
        current = activeRun.value; // Current will always be the active one.
        // Try to find currently set runs in the run data array.
        var currentIndex = helpers_1.findRunIndexFromId(current.id);
        var previousIndex = helpers_1.findRunIndexFromId(activeRunSurr.value.previous);
        var nextIndex = helpers_1.findRunIndexFromId(activeRunSurr.value.next);
        if (currentIndex >= 0) { // Found current run in array.
            if (currentIndex > 0) {
                _a = array.value.slice(currentIndex - 1), previous = _a[0], next = _a[2];
            }
            else { // We're at the start and can't splice -1.
                _b = array.value.slice(0), next = _b[1];
            }
        }
        else if (previousIndex >= 0) { // Found previous run in array, use for reference.
            _c = array.value.slice(previousIndex), previous = _c[0], next = _c[2];
        }
        else if (nextIndex >= 0) { // Found next run in array, use for reference.
            _d = array.value.slice(nextIndex - 2), previous = _d[0], next = _d[2];
        }
    }
    activeRunSurr.value = {
        previous: (previous) ? previous.id : undefined,
        current: (current) ? current.id : undefined,
        next: (next) ? next.id : undefined,
    };
    nodecg.log.debug('[Run Control] Recalculated surrounding runs');
}
/**
 * Used to update the Twitch information, used by functions in this file.
 * @param runData Run Data object.
 */
function updateTwitchInformation(runData) {
    return __awaiter(this, void 0, void 0, function () {
        var status, gameTwitch, _a, srcomGameTwitch;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!twitchAPIData.value.sync) {
                        return [2 /*return*/, false];
                    }
                    status = helpers_1.bundleConfig().twitch.streamTitle
                        .replace(new RegExp('{{game}}', 'g'), runData.game || '')
                        .replace(new RegExp('{{players}}', 'g'), helpers_1.formPlayerNamesStr(runData))
                        .replace(new RegExp('{{category}}', 'g'), runData.category || '');
                    gameTwitch = runData.gameTwitch;
                    if (!(!gameTwitch && runData.game)) return [3 /*break*/, 2];
                    return [4 /*yield*/, helpers_1.to(srcom_api_1.searchForTwitchGame(runData.game))];
                case 1:
                    _a = _c.sent(), srcomGameTwitch = _a[1];
                    gameTwitch = srcomGameTwitch || runData.game;
                    _c.label = 2;
                case 2:
                    if (!gameTwitch) return [3 /*break*/, 4];
                    return [4 /*yield*/, helpers_1.to(twitch_api_1.verifyTwitchDir(gameTwitch))];
                case 3:
                    _b = _c.sent(), gameTwitch = _b[1];
                    _c.label = 4;
                case 4:
                    helpers_1.to(twitch_api_1.updateChannelInfo(status, gameTwitch || helpers_1.bundleConfig().twitch.streamDefaultGame));
                    // Construct/send featured channels if enabled.
                    if (helpers_1.bundleConfig().twitch.ffzIntegration) {
                        helpers_1.to(ffz_ws_1.setChannels(helpers_1.getTwitchChannels(runData)));
                    }
                    return [2 /*return*/, !gameTwitch];
            }
        });
    });
}
/**
 * Change the active run to the one specified if it exists.
 * @param id The unique ID of the run you wish to change to.
 */
function changeActiveRun(id) {
    return __awaiter(this, void 0, void 0, function () {
        var runData, noTwitchGame, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    if (['running', 'paused'].includes(timer.value.state)) {
                        throw new Error('Timer is running/paused');
                    }
                    if (!id) {
                        throw new Error('No run ID was supplied');
                    }
                    runData = array.value.find(function (run) { return run.id === id; });
                    if (!!runData) return [3 /*break*/, 1];
                    throw new Error("Run with ID " + id + " was not found");
                case 1: return [4 /*yield*/, updateTwitchInformation(runData)];
                case 2:
                    noTwitchGame = _a.sent();
                    activeRun.value = clone_1.default(runData);
                    helpers_1.to(timer_1.resetTimer(true));
                    nodecg.log.debug("[Run Control] Active run changed to " + id);
                    return [2 /*return*/, noTwitchGame];
                case 3: return [3 /*break*/, 5];
                case 4:
                    err_1 = _a.sent();
                    nodecg.log.debug('[Run Control] Could not successfully change active run:', err_1);
                    throw err_1;
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Deletes a run from the run data array.
 * @param id The unique ID of the run you wish to delete.
 */
function removeRun(id) {
    return __awaiter(this, void 0, void 0, function () {
        var runIndex;
        return __generator(this, function (_a) {
            try {
                if (!id) {
                    throw new Error('No run ID was supplied');
                }
                runIndex = array.value.findIndex(function (run) { return run.id === id; });
                if (runIndex < 0) {
                    throw new Error("Run with ID " + id + " was not found");
                }
                else {
                    array.value.splice(runIndex, 1);
                    nodecg.log.debug("[Run Control] Successfully removed run " + id);
                    return [2 /*return*/];
                }
            }
            catch (err) {
                nodecg.log.debug('[Run Control] Could not successfully remove run:', err);
                throw err;
            }
            return [2 /*return*/];
        });
    });
}
/**
 * Either edits a run (if we currently have it) or adds it.
 * @param runData Run Data object.
 * @param prevID ID of the run that this run will be inserted after if applicable.
 * @param twitch Whether to update the Twitch information as well.
 */
function modifyRun(runData, prevID, twitch) {
    if (twitch === void 0) { twitch = false; }
    return __awaiter(this, void 0, void 0, function () {
        var data, allNamesAdded, ms, ms, index, prevIndex, noTwitchGame, _a, err_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 4, , 5]);
                    data = lodash_1.default.pickBy(runData, lodash_1.default.identity);
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
                        throw new Error('Team(s) are missing player(s)');
                    }
                    allNamesAdded = data.teams.every(function (team) { return (team.players.every(function (player) { return !!player.name; })); });
                    if (!allNamesAdded) {
                        throw new Error('Player(s) are missing name(s)');
                    }
                    // Verify and convert estimate.
                    if (data.estimate) {
                        if (data.estimate.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
                            ms = helpers_1.timeStrToMS(data.estimate);
                            data.estimate = helpers_1.msToTimeStr(ms);
                            data.estimateS = ms / 1000;
                        }
                        else { // Throw error if format is incorrect.
                            throw new Error('Estimate is in incorrect format');
                        }
                    }
                    else {
                        delete data.estimate;
                        delete data.estimateS;
                    }
                    // Verify and convert setup time.
                    if (data.setupTime) {
                        if (data.setupTime.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
                            ms = helpers_1.timeStrToMS(data.setupTime);
                            data.setupTime = helpers_1.msToTimeStr(ms);
                            data.setupTimeS = ms / 1000;
                        }
                        else { // Throw error if format is incorrect.
                            throw new Error('Setup time is in incorrect format');
                        }
                    }
                    else {
                        delete data.setupTime;
                        delete data.setupTimeS;
                    }
                    index = helpers_1.findRunIndexFromId(data.id);
                    if (index >= 0) { // Run already exists, edit it.
                        if (activeRun.value && data.id === activeRun.value.id) {
                            activeRun.value = clone_1.default(data);
                        }
                        array.value[index] = clone_1.default(data);
                    }
                    else { // Run is new, add it.
                        prevIndex = helpers_1.findRunIndexFromId(prevID);
                        array.value.splice(prevIndex + 1 || array.value.length, 0, clone_1.default(data));
                    }
                    if (!(twitch)) return [3 /*break*/, 2];
                    return [4 /*yield*/, updateTwitchInformation(runData)];
                case 1:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = false;
                    _b.label = 3;
                case 3:
                    noTwitchGame = _a;
                    return [2 /*return*/, noTwitchGame];
                case 4:
                    err_2 = _b.sent();
                    nodecg.log.debug('[Run Control] Could not successfully modify run:', err_2);
                    throw err_2;
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Removes the active run from the relevant replicant.
 */
function removeActiveRun() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                if (['running', 'paused'].includes(timer.value.state)) {
                    throw new Error('Timer is running/paused');
                }
                activeRun.value = undefined;
                helpers_1.to(timer_1.resetTimer(true));
                nodecg.log.debug('[Run Control] Successfully removed active run');
            }
            catch (err) {
                nodecg.log.debug('[Run Control] Could not successfully remove active run:', err);
            }
            return [2 /*return*/];
        });
    });
}
/**
 * Removes all runs in the array and the currently active run.
 */
function removeAllRuns() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                if (['running', 'paused'].includes(timer.value.state)) {
                    throw new Error('Timer is running/paused');
                }
                array.value.length = 0;
                removeActiveRun();
                helpers_1.to(timer_1.resetTimer(true));
                nodecg.log.debug('[Run Control] Successfully removed all runs');
            }
            catch (err) {
                nodecg.log.debug('[Run Control] Could not successfully remove all runs:', err);
                throw err;
            }
            return [2 /*return*/];
        });
    });
}
// NodeCG messaging system.
nodecg.listenFor('changeActiveRun', function (id, ack) {
    changeActiveRun(id)
        .then(function (noTwitchGame) { return helpers_1.processAck(ack, null, noTwitchGame); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
nodecg.listenFor('removeRun', function (id, ack) {
    removeRun(id)
        .then(function () { return helpers_1.processAck(ack, null); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
nodecg.listenFor('modifyRun', function (data, ack) {
    modifyRun(data.runData, data.prevID, data.updateTwitch)
        .then(function (noTwitchGame) { return helpers_1.processAck(ack, null, noTwitchGame); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
nodecg.listenFor('changeToNextRun', function (data, ack) {
    changeActiveRun(activeRunSurr.value.next)
        .then(function (noTwitchGame) { return helpers_1.processAck(ack, null, noTwitchGame); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
nodecg.listenFor('returnToStart', function (data, ack) {
    removeActiveRun()
        .then(function () { return helpers_1.processAck(ack, null); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
nodecg.listenFor('removeAllRuns', function (data, ack) {
    removeAllRuns()
        .then(function () { return helpers_1.processAck(ack, null); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
// Our messaging system.
events.listenFor('changeActiveRun', function (id, ack) {
    changeActiveRun(id)
        .then(function (noTwitchGame) {
        helpers_1.processAck(ack, null, noTwitchGame);
        if (noTwitchGame) {
            nodecg.sendMessage('triggerAlert', 'NoTwitchGame');
        }
    })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
events.listenFor('removeRun', function (id, ack) {
    removeRun(id)
        .then(function () { return helpers_1.processAck(ack, null); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
events.listenFor('modifyRun', function (data, ack) {
    modifyRun(data.runData, data.prevID, data.updateTwitch)
        .then(function (noTwitchGame) { return helpers_1.processAck(ack, null, noTwitchGame); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
events.listenFor('changeToNextRun', function (data, ack) {
    changeActiveRun(activeRunSurr.value.next)
        .then(function (noTwitchGame) {
        helpers_1.processAck(ack, null, noTwitchGame);
        if (noTwitchGame) {
            nodecg.sendMessage('triggerAlert', 'NoTwitchGame');
        }
    })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
events.listenFor('returnToStart', function (data, ack) {
    removeActiveRun()
        .then(function () { return helpers_1.processAck(ack, null); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
events.listenFor('removeAllRuns', function (data, ack) {
    removeAllRuns()
        .then(function () { return helpers_1.processAck(ack, null); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
activeRun.on('change', changeSurroundingRuns);
array.on('change', changeSurroundingRuns);
