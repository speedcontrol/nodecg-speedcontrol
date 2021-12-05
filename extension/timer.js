"use strict";
/* eslint import/prefer-default-export: off */
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
exports.resetTimer = void 0;
const clone_1 = __importDefault(require("clone"));
const livesplit_core_1 = __importDefault(require("livesplit-core"));
const events = __importStar(require("./util/events"));
const helpers_1 = require("./util/helpers");
const nodecg_1 = require("./util/nodecg");
const replicants_1 = require("./util/replicants");
const nodecg = (0, nodecg_1.get)();
let timer;
// Cross references for LiveSplit's TimerPhases.
const LS_TIMER_PHASE = {
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
    replicants_1.timer.value = {
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
    replicants_1.timer.value.time = (0, helpers_1.msToTimeStr)(ms);
    replicants_1.timer.value.milliseconds = ms;
    // nodecg.log.debug(`[Timer] Set to ${msToTimeStr(ms)}/${ms}`);
}
/**
 * Set game time.
 * Game Time is used so we can edit the timer easily.
 * @param ms Milliseconds you want to set the game time at.
 */
function setGameTime(ms) {
    if (replicants_1.timer.value.state === 'stopped') {
        livesplit_core_1.default.TimeSpan.fromSeconds(0).with((t) => timer.setLoadingTimes(t));
        timer.initializeGameTime();
    }
    livesplit_core_1.default.TimeSpan.fromSeconds(ms / 1000).with((t) => timer.setGameTime(t));
    nodecg.log.debug(`[Timer] Game time set to ${ms}`);
}
/**
 * Start/resume the timer, depending on the current state.
 * @param force Force the timer to start, even if it's state is running/changes are disabled.
 */
function startTimer(force) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Error if the timer is disabled.
            if (!force && replicants_1.timerChangesDisabled.value) {
                throw new Error('Timer changes are disabled');
            }
            // Error if the timer is finished.
            if (replicants_1.timer.value.state === 'finished') {
                throw new Error('Timer is in the finished state');
            }
            // Error if the timer isn't stopped or paused (and we're not forcing it).
            if (!force && !['stopped', 'paused'].includes(replicants_1.timer.value.state)) {
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
            setGameTime(replicants_1.timer.value.milliseconds);
            replicants_1.timer.value.state = 'running';
        }
        catch (err) {
            nodecg.log.debug('[Timer] Cannot start/resume timer:', err);
            throw err;
        }
    });
}
/**
 * Pause the timer.
 */
function pauseTimer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Error if the timer is disabled.
            if (replicants_1.timerChangesDisabled.value) {
                throw new Error('Timer changes are disabled');
            }
            // Error if the timer isn't running.
            if (replicants_1.timer.value.state !== 'running') {
                throw new Error('Timer is not running');
            }
            timer.pause();
            replicants_1.timer.value.state = 'paused';
            nodecg.log.debug('[Timer] Paused');
        }
        catch (err) {
            nodecg.log.debug('[Timer] Cannot pause timer:', err);
            throw err;
        }
    });
}
/**
 * Reset the timer.
 * @param force Forces a reset even if changes are disabled.
 */
function resetTimer(force) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Error if the timer is disabled.
            if (!force && replicants_1.timerChangesDisabled.value) {
                throw new Error('Timer changes are disabled');
            }
            // Error if the timer is stopped.
            if (replicants_1.timer.value.state === 'stopped') {
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
    });
}
exports.resetTimer = resetTimer;
/**
 * Stop/finish the timer.
 * @param id Team's ID you wish to have finish (if there is an active run).
 * @param forfeit Specify this if the team has forfeit.
 */
function stopTimer(id, forfeit) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Error if the timer is disabled.
            if (replicants_1.timerChangesDisabled.value) {
                throw new Error('Timer changes are disabled');
            }
            // Error if timer is not running.
            if (!['running', 'paused'].includes(replicants_1.timer.value.state)) {
                throw new Error('Timer is not running/paused');
            }
            // Error if there's an active run but no UUID was sent.
            if (!id && replicants_1.runDataActiveRun.value && replicants_1.runDataActiveRun.value.teams.length) {
                throw new Error('A run is active that has teams but no team ID was supplied');
            }
            // Error if the team has already finished.
            if (id && replicants_1.timer.value.teamFinishTimes[id]) {
                throw new Error('The specified team has already finished');
            }
            // If we have a UUID and an active run, set that team as finished.
            if (id && replicants_1.runDataActiveRun.value) {
                const timerRepCopy = Object.assign(Object.assign({}, (0, clone_1.default)(replicants_1.timer.value)), { teamFinishTimes: undefined, state: undefined });
                delete timerRepCopy.teamFinishTimes;
                delete timerRepCopy.state;
                replicants_1.timer.value.teamFinishTimes[id] = Object.assign(Object.assign({}, timerRepCopy), { state: (forfeit) ? 'forfeit' : 'completed' });
                nodecg.log.debug(`[Timer] Team ${id} finished at ${timerRepCopy.time}${(forfeit) ? ' (forfeit)' : ''}`);
            }
            // Stop the timer if all the teams have finished (or no teams exist).
            const teamsCount = (replicants_1.runDataActiveRun.value) ? replicants_1.runDataActiveRun.value.teams.length : 0;
            const teamsFinished = Object.keys(replicants_1.timer.value.teamFinishTimes).length;
            if (teamsFinished >= teamsCount) {
                if (replicants_1.timer.value.state === 'paused') {
                    timer.resume();
                }
                timer.split();
                replicants_1.timer.value.state = 'finished';
                if (replicants_1.runDataActiveRun.value) {
                    replicants_1.runFinishTimes.value[replicants_1.runDataActiveRun.value.id] = (0, clone_1.default)(replicants_1.timer.value);
                }
                nodecg.log.debug('[Timer] Finished');
            }
        }
        catch (err) {
            nodecg.log.debug('[Timer] Cannot stop timer:', err);
            throw err;
        }
    });
}
/**
 * Undo the timer from being stopped.
 * @param id ID of team you wish to undo (if there is an active run).
 */
function undoTimer(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Error if the timer is disabled.
            if (replicants_1.timerChangesDisabled.value) {
                throw new Error('Timer changes are disabled');
            }
            // Error if timer is not finished or running.
            if (!['finished', 'running'].includes(replicants_1.timer.value.state)) {
                throw new Error('Timer is not finished/running');
            }
            // Error if there's an active run but no UUID was sent.
            if (!id && replicants_1.runDataActiveRun.value) {
                throw new Error('A run is active but no team ID was supplied');
            }
            // If we have a UUID and an active run, remove that team's finish time.
            if (id && replicants_1.runDataActiveRun.value) {
                delete replicants_1.timer.value.teamFinishTimes[id];
                nodecg.log.debug(`[Timer] Team ${id} finish time undone`);
            }
            // Undo the split if needed.
            if (replicants_1.timer.value.state === 'finished') {
                if (timer.currentPhase() === 0) {
                    timer.start();
                    setGameTime(replicants_1.timer.value.milliseconds);
                }
                else {
                    timer.undoSplit();
                }
                replicants_1.timer.value.state = 'running';
                if (replicants_1.runDataActiveRun.value && replicants_1.runFinishTimes.value[replicants_1.runDataActiveRun.value.id]) {
                    delete replicants_1.runFinishTimes.value[replicants_1.runDataActiveRun.value.id];
                }
                nodecg.log.debug('[Timer] Undone');
            }
        }
        catch (err) {
            nodecg.log.debug('[Timer] Cannot undo timer:', err);
            throw err;
        }
    });
}
/**
 * Edit the timer time.
 * @param time Time string (HH:MM:SS).
 */
function editTimer(time) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Error if the timer is disabled.
            if (replicants_1.timerChangesDisabled.value) {
                throw new Error('Timer changes are disabled');
            }
            // Error if the timer is not stopped/paused.
            if (!['stopped', 'paused'].includes(replicants_1.timer.value.state)) {
                throw new Error('Timer is not stopped/paused');
            }
            // Error if the string formatting is not correct.
            if (!time.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
                throw new Error('The supplied string is in the incorrect format');
            }
            const ms = (0, helpers_1.timeStrToMS)(time);
            setTime(ms);
            nodecg.log.debug(`[Timer] Edited to ${time}/${ms}`);
        }
        catch (err) {
            nodecg.log.debug('[Timer] Cannot edit timer:', err);
            throw err;
        }
    });
}
/**
 * This stuff runs every 1/10th a second to keep the time updated.
 */
function tick() {
    if (replicants_1.timer.value.state === 'running') {
        // Calculates the milliseconds the timer has been running for and updates the replicant.
        const time = timer.currentTime().gameTime();
        const ms = Math.floor((time.totalSeconds()) * 1000);
        setTime(ms);
        replicants_1.timer.value.timestamp = Date.now();
    }
}
// Sets up the timer with a single split.
const liveSplitRun = livesplit_core_1.default.Run.new();
liveSplitRun.pushSegment(livesplit_core_1.default.Segment.new('finish'));
timer = livesplit_core_1.default.Timer.new(liveSplitRun);
// If the timer was running when last closed, tries to resume it at the correct time.
if (replicants_1.timer.value.state === 'running') {
    const missedTime = Date.now() - replicants_1.timer.value.timestamp;
    const previousTime = replicants_1.timer.value.milliseconds;
    const timeOffset = previousTime + missedTime;
    setTime(timeOffset);
    nodecg.log.info(`[Timer] Recovered ${(missedTime / 1000).toFixed(2)} seconds of lost time`);
    startTimer(true)
        .catch(() => { });
}
// NodeCG messaging system.
nodecg.listenFor('timerStart', (data, ack) => {
    startTimer()
        .then(() => (0, helpers_1.processAck)(ack, null))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
nodecg.listenFor('timerPause', (data, ack) => {
    pauseTimer()
        .then(() => (0, helpers_1.processAck)(ack, null))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
nodecg.listenFor('timerReset', (force, ack) => {
    resetTimer(force)
        .then(() => (0, helpers_1.processAck)(ack, null))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
nodecg.listenFor('timerStop', (data, ack) => {
    stopTimer(data.id, data.forfeit)
        .then(() => (0, helpers_1.processAck)(ack, null))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
nodecg.listenFor('timerUndo', (id, ack) => {
    undoTimer(id)
        .then(() => (0, helpers_1.processAck)(ack, null))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
nodecg.listenFor('timerEdit', (time, ack) => {
    editTimer(time)
        .then(() => (0, helpers_1.processAck)(ack, null))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
// Our messaging system.
events.listenFor('timerStart', (data, ack) => {
    startTimer()
        .then(() => (0, helpers_1.processAck)(ack, null))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
events.listenFor('timerPause', (data, ack) => {
    pauseTimer()
        .then(() => (0, helpers_1.processAck)(ack, null))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
events.listenFor('timerReset', (force, ack) => {
    resetTimer(force)
        .then(() => (0, helpers_1.processAck)(ack, null))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
events.listenFor('timerStop', (data, ack) => {
    stopTimer(data.id, data.forfeit)
        .then(() => (0, helpers_1.processAck)(ack, null))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
events.listenFor('timerUndo', (id, ack) => {
    undoTimer(id)
        .then(() => (0, helpers_1.processAck)(ack, null))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
events.listenFor('timerEdit', (time, ack) => {
    editTimer(time)
        .then(() => (0, helpers_1.processAck)(ack, null))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
setInterval(tick, 100);
