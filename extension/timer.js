"use strict";
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
var helpers_1 = __importDefault(require("./util/helpers"));
var msToTimeStr = helpers_1.default.msToTimeStr, timeStrToMS = helpers_1.default.timeStrToMS, cgListenForHelper = helpers_1.default.cgListenForHelper;
// Cross references for LiveSplit's TimerPhases.
var LS_TIMER_PHASE = {
    NotRunning: 0,
    Running: 1,
    Ended: 2,
    Paused: 3,
};
var TimerApp = /** @class */ (function () {
    /* eslint-enable */
    function TimerApp(nodecg) {
        var _this = this;
        this.timerRep = nodecg.Replicant('timer');
        this.activeRun = nodecg.Replicant('runDataActiveRun');
        this.runFinishTimes = nodecg.Replicant('runFinishTimes');
        this.changesDisabled = nodecg.Replicant('timerChangesDisabled');
        // Sets up the timer with a single split.
        var liveSplitRun = livesplit_core_1.default.Run.new();
        liveSplitRun.pushSegment(livesplit_core_1.default.Segment.new('finish'));
        this.timer = livesplit_core_1.default.Timer.new(liveSplitRun);
        // If the timer was running when last closed, tries to resume it at the correct time.
        if (this.timerRep.value.state === 'running') {
            var missedTime = Date.now() - this.timerRep.value.timestamp;
            var previousTime = this.timerRep.value.milliseconds;
            var timeOffset = previousTime + missedTime;
            this.setTime(timeOffset);
            nodecg.log.info('Timer recovered %s seconds of lost time.', (missedTime / 1000).toFixed(2));
            this.startTimer(true);
        }
        // NodeCG messaging system.
        nodecg.listenFor('timerStart', function (data, ack) {
            cgListenForHelper(_this.startTimer(), ack);
        });
        nodecg.listenFor('timerPause', function (data, ack) {
            cgListenForHelper(_this.pauseTimer(), ack);
        });
        nodecg.listenFor('timerReset', function (data, ack) {
            cgListenForHelper(_this.resetTimer(), ack);
        });
        nodecg.listenFor('timerStop', function (data, ack) {
            cgListenForHelper(_this.stopTimer(data), ack);
        });
        nodecg.listenFor('timerUndo', function (data, ack) {
            cgListenForHelper(_this.undoTimer(data), ack);
        });
        nodecg.listenFor('timerEdit', function (data, ack) {
            cgListenForHelper(_this.editTimer(data), ack);
        });
        // Our messaging system.
        events.listenFor('timerStart', function (data, ack) {
            _this.startTimer()
                .then(function () { ack(null); })
                .catch(function (err) { ack(err); });
        });
        events.listenFor('timerReset', function (data, ack) {
            _this.resetTimer()
                .then(function () { ack(null); })
                .catch(function (err) { ack(err); });
        });
        events.listenFor('timerStop', function (data, ack) {
            _this.stopTimer(data)
                .then(function () { ack(null); })
                .catch(function (err) { ack(err); });
        });
        setInterval(function () { return _this.tick(); }, 100);
    }
    /**
     * Start/resume the timer, depending on the current state.
     * @param force Force the timer to start, even if it's state is running.
     */
    TimerApp.prototype.startTimer = function (force) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // Error if the timer is disabled.
            if (_this.changesDisabled.value) {
                reject(new Error('Cannot start/resume timer as changes are disabled.'));
                return;
            }
            // Error if the timer is finished.
            if (_this.timerRep.value.state === 'finished') {
                reject(new Error('Cannot start/resume timer as it is in the finished state.'));
                return;
            }
            // Error if the timer isn't stopped or paused (and we're not forcing it).
            if (!force && !['stopped', 'paused'].includes(_this.timerRep.value.state)) {
                reject(new Error('Cannot start/resume timer as it is not stopped/pasued.'));
                return;
            }
            if (_this.timer.currentPhase() === LS_TIMER_PHASE.NotRunning) {
                _this.timer.start();
            }
            else {
                _this.timer.resume();
            }
            _this.setGameTime(_this.timerRep.value.milliseconds);
            _this.timerRep.value.state = 'running';
            resolve();
        });
    };
    /**
     * Pause the timer.
     */
    TimerApp.prototype.pauseTimer = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // Error if the timer is disabled.
            if (_this.changesDisabled.value) {
                reject(new Error('Cannot start/resume timer as changes are disabled.'));
                return;
            }
            // Error if the timer isn't running.
            if (_this.timerRep.value.state !== 'running') {
                reject(new Error('Cannot pause the timer as it is not running.'));
                return;
            }
            _this.timer.pause();
            _this.timerRep.value.state = 'paused';
            resolve();
        });
    };
    /**
     * Reset the timer.
     */
    TimerApp.prototype.resetTimer = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // Error if the timer is disabled.
            if (_this.changesDisabled.value) {
                reject(new Error('Cannot start/resume timer as changes are disabled.'));
                return;
            }
            // Error if the timer is stopped.
            if (_this.timerRep.value.state === 'stopped') {
                reject(new Error('Cannot reset the timer as it is stopped.'));
                return;
            }
            _this.timer.reset(false);
            _this.resetTimerRepToDefault();
            resolve();
        });
    };
    /**
     * Stop/finish the timer.
     * @param uuid Team's ID you wish to have finish (if there is an active run).
     */
    TimerApp.prototype.stopTimer = function (uuid) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // Error if the timer is disabled.
            if (_this.changesDisabled.value) {
                reject(new Error('Cannot start/resume timer as changes are disabled.'));
                return;
            }
            // Error if timer is not running.
            if (_this.timerRep.value.state !== 'running') {
                reject(new Error('Cannot stop the timer as it is not running.'));
                return;
            }
            // Error if there's an active run but no UUID was sent.
            if (!uuid && _this.activeRun.value) {
                reject(new Error('Cannot stop the timer as a run is active but no team ID was supplied.'));
                return;
            }
            // Error if the team has already finished.
            if (uuid && _this.timerRep.value.teamFinishTimes[uuid]) {
                reject(new Error('Cannot stop the timer as the specified team has already finished.'));
                return;
            }
            // If we have a UUID and an active run, set that team as finished.
            if (uuid && _this.activeRun.value) {
                var timerRepCopy = clone_1.default(_this.timerRep.value);
                delete timerRepCopy.teamFinishTimes;
                _this.timerRep.value.teamFinishTimes[uuid] = timerRepCopy;
            }
            // Stop the timer if all the teams have finished (or no teams exist).
            var teamsCount = (_this.activeRun.value) ? _this.activeRun.value.teams.length : 0;
            var teamsFinished = Object.keys(_this.timerRep.value.teamFinishTimes).length;
            if (teamsFinished >= teamsCount) {
                _this.timer.split();
                _this.timerRep.value.state = 'finished';
                if (_this.activeRun.value) {
                    _this.runFinishTimes.value[_this.activeRun.value.id] = _this.timerRep.value.time;
                }
            }
            resolve();
        });
    };
    /**
     * Undo the timer from being stopped.
     * @param uuid ID of team you wish to undo (if there is an active run).
     */
    TimerApp.prototype.undoTimer = function (uuid) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // Error if the timer is disabled.
            if (_this.changesDisabled.value) {
                reject(new Error('Cannot start/resume timer as changes are disabled.'));
                return;
            }
            // Error if timer is not finished or running.
            if (!['finished', 'running'].includes(_this.timerRep.value.state)) {
                reject(new Error('Cannot undo the timer as it is not finished/running.'));
                return;
            }
            // Error if there's an active run but no UUID was sent.
            if (!uuid && _this.activeRun.value) {
                reject(new Error('Cannot undo the timer as a run is active but no team ID was supplied.'));
                return;
            }
            // If we have a UUID and an active run, remove that team's finish time.
            if (uuid && _this.activeRun.value) {
                delete _this.timerRep.value.teamFinishTimes[uuid];
            }
            // Undo the split if needed.
            if (_this.timerRep.value.state === 'finished') {
                _this.timer.undoSplit();
                _this.timerRep.value.state = 'running';
                if (_this.activeRun.value && _this.runFinishTimes.value[_this.activeRun.value.id]) {
                    delete _this.runFinishTimes.value[_this.activeRun.value.id];
                }
            }
            resolve();
        });
    };
    /**
     * Edit the timer time.
     * @param time Time string (HH:MM:SS).
     */
    TimerApp.prototype.editTimer = function (time) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // Error if the timer is disabled.
            if (_this.changesDisabled.value) {
                reject(new Error('Cannot start/resume timer as changes are disabled.'));
                return;
            }
            // Error if the timer is not stopped/paused.
            if (!['stopped', 'paused'].includes(_this.timerRep.value.state)) {
                reject(new Error('Cannot edit the timer as it is not stopped/paused.'));
                return;
            }
            // Error if the string formatting is not correct.
            if (!time.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
                reject(new Error('Cannot edit the timer as the supplied string is in the incorrect format.'));
                return;
            }
            var ms = timeStrToMS(time);
            _this.setTime(ms);
            resolve();
        });
    };
    /**
     * This stuff runs every 1/10th a second to keep the time updated.
     */
    TimerApp.prototype.tick = function () {
        if (this.timerRep.value.state === 'running') {
            // Calculates the milliseconds the timer has been running for and updates the replicant.
            var time = this.timer.currentTime().gameTime();
            var ms = Math.floor((time.totalSeconds()) * 1000);
            this.setTime(ms);
            this.timerRep.value.timestamp = Date.now();
        }
    };
    /**
     * Set timer replicant string time and milliseconds based off a millisecond value.
     * @param ms Milliseconds you want to set the timer replicant at.
     */
    TimerApp.prototype.setTime = function (ms) {
        this.timerRep.value.time = msToTimeStr(ms);
        this.timerRep.value.milliseconds = ms;
    };
    /**
     * Set game time.
     * Game Time is used so we can edit the timer easily.
     * @param ms Milliseconds you want to set the game time at.
     */
    TimerApp.prototype.setGameTime = function (ms) {
        var _this = this;
        if (this.timerRep.value.state === 'stopped') {
            livesplit_core_1.default.TimeSpan.fromSeconds(0).with(function (t) { return _this.timer.setLoadingTimes(t); });
            this.timer.initializeGameTime();
        }
        livesplit_core_1.default.TimeSpan.fromSeconds(ms / 1000).with(function (t) { return _this.timer.setGameTime(t); });
    };
    /**
     * Resets timer replicant to default settings.
     * We *should* be able to just do timerRep.opts.defaultValue but it doesn't work :(
     */
    TimerApp.prototype.resetTimerRepToDefault = function () {
        this.timerRep.value = {
            time: '00:00:00',
            state: 'stopped',
            milliseconds: 0,
            timestamp: 0,
            teamFinishTimes: {},
        };
    };
    return TimerApp;
}());
exports.default = TimerApp;
