"use strict";
/* eslint import/prefer-default-export: off */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var livesplit_core_1 = __importDefault(require("livesplit-core"));
var events = __importStar(require("./util/events"));
var helpers_1 = require("./util/helpers");
var nodecg_1 = require("./util/nodecg");
var nodecg = nodecg_1.get();
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: persistenceInterval not typed yet
var timerRep = nodecg.Replicant('timer', { persistenceInterval: 1000 });
var activeRun = nodecg.Replicant('runDataActiveRun');
var runFinishTimes = nodecg.Replicant('runFinishTimes');
var changesDisabled = nodecg.Replicant('timerChangesDisabled');
var timer;
// Cross references for LiveSplit's TimerPhases.
var LS_TIMER_PHASE = {
    NotRunning: 0,
    Running: 1,
    Ended: 2,
    Paused: 3,
};
/**
 * Resets timer replicant to default settings.
 * We *should* be able to just do timerRep.opts.defaultValue but it doesn't work :(
 */
function resetTimerRepToDefault() {
    timerRep.value = {
        time: '00:00:00',
        state: 'stopped',
        milliseconds: 0,
        timestamp: 0,
        teamFinishTimes: {},
    };
    nodecg.log.debug('[Timer] Replicant restored to default');
}
/**
 * Set timer replicant string time and milliseconds based off a millisecond value.
 * @param ms Milliseconds you want to set the timer replicant at.
 */
function setTime(ms) {
    timerRep.value.time = helpers_1.msToTimeStr(ms);
    timerRep.value.milliseconds = ms;
    // nodecg.log.debug(`[Timer] Set to ${msToTimeStr(ms)}/${ms}`);
}
/**
 * Set game time.
 * Game Time is used so we can edit the timer easily.
 * @param ms Milliseconds you want to set the game time at.
 */
function setGameTime(ms) {
    if (timerRep.value.state === 'stopped') {
        livesplit_core_1.default.TimeSpan.fromSeconds(0).with(function (t) { return timer.setLoadingTimes(t); });
        timer.initializeGameTime();
    }
    livesplit_core_1.default.TimeSpan.fromSeconds(ms / 1000).with(function (t) { return timer.setGameTime(t); });
    nodecg.log.debug("[Timer] Game time set to " + ms);
}
/**
 * Start/resume the timer, depending on the current state.
 * @param force Force the timer to start, even if it's state is running/changes are disabled.
 */
function startTimer(force) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                // Error if the timer is disabled.
                if (!force && changesDisabled.value) {
                    throw new Error('Timer changes are disabled');
                }
                // Error if the timer is finished.
                if (timerRep.value.state === 'finished') {
                    throw new Error('Timer is in the finished state');
                }
                // Error if the timer isn't stopped or paused (and we're not forcing it).
                if (!force && !['stopped', 'paused'].includes(timerRep.value.state)) {
                    throw new Error('Timer is not stopped/paused');
                }
                if (timer.currentPhase() === LS_TIMER_PHASE.NotRunning) {
                    timer.start();
                    nodecg.log.debug('[Timer] Started');
                }
                else {
                    timer.resume();
                    nodecg.log.debug('[Timer] Resumed');
                }
                setGameTime(timerRep.value.milliseconds);
                timerRep.value.state = 'running';
            }
            catch (err) {
                nodecg.log.debug('[Timer] Cannot start/resume timer:', err);
                throw err;
            }
            return [2 /*return*/];
        });
    });
}
/**
 * Pause the timer.
 */
function pauseTimer() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                // Error if the timer is disabled.
                if (changesDisabled.value) {
                    throw new Error('Timer changes are disabled');
                }
                // Error if the timer isn't running.
                if (timerRep.value.state !== 'running') {
                    throw new Error('Timer is not running');
                }
                timer.pause();
                timerRep.value.state = 'paused';
                nodecg.log.debug('[Timer] Paused');
            }
            catch (err) {
                nodecg.log.debug('[Timer] Cannot pause timer:', err);
                throw err;
            }
            return [2 /*return*/];
        });
    });
}
/**
 * Reset the timer.
 * @param force Forces a reset even if changes are disabled.
 */
function resetTimer(force) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                // Error if the timer is disabled.
                if (!force && changesDisabled.value) {
                    throw new Error('Timer changes are disabled');
                }
                // Error if the timer is stopped.
                if (timerRep.value.state === 'stopped') {
                    throw new Error('Timer is stopped');
                }
                timer.reset(false);
                resetTimerRepToDefault();
                nodecg.log.debug('[Timer] Reset');
            }
            catch (err) {
                nodecg.log.debug('[Timer] Cannot reset timer:', err);
                throw err;
            }
            return [2 /*return*/];
        });
    });
}
exports.resetTimer = resetTimer;
/**
 * Stop/finish the timer.
 * @param id Team's ID you wish to have finish (if there is an active run).
 * @param forfeit Specify this if the team has forfeit.
 */
function stopTimer(id, forfeit) {
    return __awaiter(this, void 0, void 0, function () {
        var timerRepCopy, teamsCount, teamsFinished;
        return __generator(this, function (_a) {
            try {
                // Error if the timer is disabled.
                if (changesDisabled.value) {
                    throw new Error('Timer changes are disabled');
                }
                // Error if timer is not running.
                if (timerRep.value.state !== 'running') {
                    throw new Error('Timer is not running');
                }
                // Error if there's an active run but no UUID was sent.
                if (!id && activeRun.value && activeRun.value.teams.length) {
                    throw new Error('A run is active that has teams but no team ID was supplied');
                }
                // Error if the team has already finished.
                if (id && timerRep.value.teamFinishTimes[id]) {
                    throw new Error('The specified team has already finished');
                }
                // If we have a UUID and an active run, set that team as finished.
                if (id && activeRun.value) {
                    timerRepCopy = clone_1.default(timerRep.value);
                    delete timerRepCopy.teamFinishTimes;
                    delete timerRepCopy.state;
                    timerRep.value.teamFinishTimes[id] = __assign(__assign({}, timerRepCopy), { state: (forfeit) ? 'forfeit' : 'completed' });
                    nodecg.log.debug("[Timer] Team " + id + " finished at " + timerRepCopy.time + ((forfeit) ? ' (forfeit)' : ''));
                }
                teamsCount = (activeRun.value) ? activeRun.value.teams.length : 0;
                teamsFinished = Object.keys(timerRep.value.teamFinishTimes).length;
                if (teamsFinished >= teamsCount) {
                    timer.split();
                    timerRep.value.state = 'finished';
                    if (activeRun.value) {
                        runFinishTimes.value[activeRun.value.id] = clone_1.default(timerRep.value);
                    }
                    nodecg.log.debug('[Timer] Finished');
                }
            }
            catch (err) {
                nodecg.log.debug('[Timer] Cannot stop timer:', err);
                throw err;
            }
            return [2 /*return*/];
        });
    });
}
/**
 * Undo the timer from being stopped.
 * @param id ID of team you wish to undo (if there is an active run).
 */
function undoTimer(id) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                // Error if the timer is disabled.
                if (changesDisabled.value) {
                    throw new Error('Timer changes are disabled');
                }
                // Error if timer is not finished or running.
                if (!['finished', 'running'].includes(timerRep.value.state)) {
                    throw new Error('Timer is not finished/running');
                }
                // Error if there's an active run but no UUID was sent.
                if (!id && activeRun.value) {
                    throw new Error('A run is active but no team ID was supplied');
                }
                // If we have a UUID and an active run, remove that team's finish time.
                if (id && activeRun.value) {
                    delete timerRep.value.teamFinishTimes[id];
                    nodecg.log.debug("[Timer] Team " + id + " finish time undone");
                }
                // Undo the split if needed.
                if (timerRep.value.state === 'finished') {
                    timer.undoSplit();
                    timerRep.value.state = 'running';
                    if (activeRun.value && runFinishTimes.value[activeRun.value.id]) {
                        delete runFinishTimes.value[activeRun.value.id];
                    }
                    nodecg.log.debug('[Timer] Undone');
                }
            }
            catch (err) {
                nodecg.log.debug('[Timer] Cannot undo timer:', err);
                throw err;
            }
            return [2 /*return*/];
        });
    });
}
/**
 * Edit the timer time.
 * @param time Time string (HH:MM:SS).
 */
function editTimer(time) {
    return __awaiter(this, void 0, void 0, function () {
        var ms;
        return __generator(this, function (_a) {
            try {
                // Error if the timer is disabled.
                if (changesDisabled.value) {
                    throw new Error('Timer changes are disabled');
                }
                // Error if the timer is not stopped/paused.
                if (!['stopped', 'paused'].includes(timerRep.value.state)) {
                    throw new Error('Timer is not stopped/paused');
                }
                // Error if the string formatting is not correct.
                if (!time.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
                    throw new Error('The supplied string is in the incorrect format');
                }
                ms = helpers_1.timeStrToMS(time);
                setTime(ms);
                nodecg.log.debug("[Timer] Edited to " + time + "/" + ms);
            }
            catch (err) {
                nodecg.log.debug('[Timer] Cannot edit timer:', err);
                throw err;
            }
            return [2 /*return*/];
        });
    });
}
/**
 * This stuff runs every 1/10th a second to keep the time updated.
 */
function tick() {
    if (timerRep.value.state === 'running') {
        // Calculates the milliseconds the timer has been running for and updates the replicant.
        var time = timer.currentTime().gameTime();
        var ms = Math.floor((time.totalSeconds()) * 1000);
        setTime(ms);
        timerRep.value.timestamp = Date.now();
    }
}
// Sets up the timer with a single split.
var liveSplitRun = livesplit_core_1.default.Run.new();
liveSplitRun.pushSegment(livesplit_core_1.default.Segment.new('finish'));
timer = livesplit_core_1.default.Timer.new(liveSplitRun);
// If the timer was running when last closed, tries to resume it at the correct time.
if (timerRep.value.state === 'running') {
    var missedTime = Date.now() - timerRep.value.timestamp;
    var previousTime = timerRep.value.milliseconds;
    var timeOffset = previousTime + missedTime;
    setTime(timeOffset);
    nodecg.log.info("[Timer] Recovered " + (missedTime / 1000).toFixed(2) + " seconds of lost time");
    startTimer(true)
        .catch(function () { });
}
// NodeCG messaging system.
nodecg.listenFor('timerStart', function (data, ack) {
    startTimer()
        .then(function () { return helpers_1.processAck(ack, null); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
nodecg.listenFor('timerPause', function (data, ack) {
    pauseTimer()
        .then(function () { return helpers_1.processAck(ack, null); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
nodecg.listenFor('timerReset', function (force, ack) {
    resetTimer(force)
        .then(function () { return helpers_1.processAck(ack, null); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
nodecg.listenFor('timerStop', function (data, ack) {
    stopTimer(data.id, data.forfeit)
        .then(function () { return helpers_1.processAck(ack, null); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
nodecg.listenFor('timerUndo', function (id, ack) {
    undoTimer(id)
        .then(function () { return helpers_1.processAck(ack, null); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
nodecg.listenFor('timerEdit', function (time, ack) {
    editTimer(time)
        .then(function () { return helpers_1.processAck(ack, null); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
// Our messaging system.
events.listenFor('timerStart', function (data, ack) {
    startTimer()
        .then(function () { return helpers_1.processAck(ack, null); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
events.listenFor('timerPause', function (data, ack) {
    pauseTimer()
        .then(function () { return helpers_1.processAck(ack, null); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
events.listenFor('timerReset', function (force, ack) {
    resetTimer(force)
        .then(function () { return helpers_1.processAck(ack, null); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
events.listenFor('timerStop', function (data, ack) {
    stopTimer(data.id, data.forfeit)
        .then(function () { return helpers_1.processAck(ack, null); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
events.listenFor('timerUndo', function (id, ack) {
    undoTimer(id)
        .then(function () { return helpers_1.processAck(ack, null); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
events.listenFor('timerEdit', function (time, ack) {
    editTimer(time)
        .then(function () { return helpers_1.processAck(ack, null); })
        .catch(function (err) { return helpers_1.processAck(ack, err); });
});
setInterval(tick, 100);
