'use strict';

var events = require('events');
var inherits = require('inherits');
var NanoTimer = require('nanotimer');

/**
 * Construct a new Rieussec stopwatch
 *
 * @class Rieussec
 * @classdesc A rieussec stopwatch object.
 *
 * @param {Number} tickRate - How often (in milliseconds) to emit "tick" events
 */
var Rieussec = function(tickRate){
    events.EventEmitter.call(this);

    // Initialize private properties
    this._milliseconds = 0;
    this._setState('stopped');
    this._timer = new NanoTimer();

    tickRate = tickRate || 100;
    Object.defineProperty(this, 'tickRate', {
        enumerable: true,
        configurable: false,
        writable: false,
        value: tickRate
    });
};

inherits(Rieussec, events.EventEmitter);

/**
 * Start the timer.
 * @memberof Rieussec
 * @method start
 */
Rieussec.prototype.start = function() {
    if (this._state === 'stopped' || this._state === 'paused') {
        this._tick(this._milliseconds);
        this._startInterval();
        return true;
    } else {
        return false;
    }
};

/**
 * Pause the timer.
 * @memberof Rieussec
 * @method pause
 */
Rieussec.prototype.pause = function() {
    if (this._state === 'running') {
        this._stopInterval();
        this._setState('paused');
        this._milliseconds += this.hrtimeToMs(process.hrtime(this._lastTickHrtime));
        this._lastTickHrtime = process.hrtime();
        this._tick(this._milliseconds);
        return true;
    } else {
        return false;
    }
};

/**
 * Reset the timer.
 * @memberof Rieussec
 * @method reset
 */
Rieussec.prototype.reset = function() {
    this._stopInterval();
    this._milliseconds = 0;
    this._tick(0);
    this._setState('stopped');
};

/**
 * Manually set the timer (in milliseconds).
 * @memberof Rieussec
 * @method setMilliseconds
 * @param {Number} ms - The new duration of the timer
 * @param {Boolean} [keepCycle=false] - If true, retains the decimal value from the previous tick, keeping the cycle consistent.
 */
Rieussec.prototype.setMilliseconds = function(ms, keepCycle) {
    // Retains the decimal portion of the previous number, which keeps the tick cycle consistent
    if (keepCycle) {
        if (this._state !== 'paused') {
            this._milliseconds = this.hrtimeToMs(process.hrtime(this._lastTickHrtime));
        }

        var modThousands = this._milliseconds % 1000;
        this._milliseconds = ms - (ms % 1000) + modThousands;
    } else {
        this._milliseconds = ms;
    }

    this._tick(this._milliseconds);
};

Rieussec.prototype.hrtimeToMs = function(hrtime) {
    return Math.floor(hrtime[0] * 1000 + hrtime[1] / 1000000);
};

Rieussec.prototype._tick = function(ms) {
    this._lastTickHrtime = process.hrtime();
    if (typeof (ms) !== 'undefined') {
        this.emit('tick', ms);
    } else {
        if (this._state === 'stopped') return;
        this._milliseconds += this.tickRate;
        this.emit('tick', this._milliseconds);
    }
};

Rieussec.prototype._startInterval = function() {
    if (this._state === 'running') {
        return false;
    } else {
        this._setState('running');
        this._timer.setInterval(this._tick.bind(this), null, this.tickRate + 'm');
        return true;
    }
};

Rieussec.prototype._stopInterval = function() {
    if (this._state === 'running') {
        this._timer.clearInterval();
        return true;
    } else {
        return false;
    }
};

Rieussec.prototype._setState = function(state) {
    this._state = state;
    this.emit('state', state);
};

module.exports = Rieussec;
