// Code based off of stuff used for GamesDoneQuick.
// https://github.com/GamesDoneQuick/sgdq15-layouts/blob/master/extension/stopwatches.js
// https://github.com/GamesDoneQuick/agdq18-layouts/blob/master/extension/timekeeping.js

'use strict';
module.exports = function(nodecg) {
	// Cross references for LiveSplit's TimerPhases.
	const LS_TIMER_PHASE = {
		NotRunning: 0,
		Running: 1,
		Ended: 2,
		Paused: 3
	};
	
	// Storage for the stopwatch data.
	var defaultStopwatch = {time: '00:00:00', state: 'stopped', milliseconds: 0};
	var stopwatch = nodecg.Replicant('stopwatch', {defaultValue: defaultStopwatch});

	// If the timer was running when last closed, changes it to being paused.
	if (stopwatch.value.state === 'running') stopwatch.value.state = 'paused';
	
	// Load the existing time and start the stopwatch at that if needed/possible.
	var startMS = stopwatch.value.milliseconds || 0;
	
	// Sets up the timer with a single split.
	const liveSplit = require('livesplit-core');
	var liveSplitRun = liveSplit.Run.new();
	liveSplitRun.pushSegment(liveSplit.Segment.new('finish'));
	var timer = liveSplit.Timer.new(liveSplitRun);
	
	// Return timer to existing time from above.
	timer.start();
	timer.pause();
	initGameTime(startMS);
	
	// Listeners, redirected to functions below.
	nodecg.listenFor('startTime', start);
	nodecg.listenFor('pauseTime', pause);
	nodecg.listenFor('finishTime', finish);
	nodecg.listenFor('resetTime', reset);
	nodecg.listenFor('setTime', edit);
	
	// This stuff runs every 1/10th a second to keep the time updated.
	setInterval(tick, 100);
	function tick() {
		// Will not run if timer isn't running or game time doesn't exist.
		if (stopwatch.value.state !== 'running' || !timer.currentTime().gameTime())
			return;
		
		// Calculates the milliseconds the timer has been running for and updates the stopwatch.
		var ms = Math.floor((timer.currentTime().gameTime().totalSeconds())*1000);
		stopwatch.value.time = msToTime(ms);
		stopwatch.value.milliseconds = ms;
	}
	
	function start() {
		// Catch if timer is running and we called this function.
		if (stopwatch.value.state === 'running')
			return;
		
		// Start/resume the timer depending on which is needed.
		stopwatch.value.state = 'running';
		if (timer.currentPhase() === LS_TIMER_PHASE.NotRunning) {
			timer.start();
			initGameTime(0);
		}
		else
			timer.resume();
	}
	
	function pause() {
		timer.pause();
		stopwatch.value.state = 'paused';
	}
	
	function reset() {
		pause();
		timer.reset(true);
		stopwatch.value = defaultStopwatch; // Resets stopwatch to it's defaults.
	}
	
	function finish() {
		pause(); // For now this just pauses the timer.
		stopwatch.value.state = 'finished';
	}
	
	function edit(time) {
		// Check to see if the time was given in the correct format and if it's stopped/paused.
		if (stopwatch.value.state === 'stopped' || stopwatch.value.state === 'paused'
		|| time.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
			var ms = timeToMS(time);
			liveSplit.TimeSpan.fromSeconds((ms/1000)).with(t => timer.setGameTime(t));
			stopwatch.value.time = msToTime(ms);
			stopwatch.value.milliseconds = ms;
		}
	}
	
	// Game Time is used so we can edit the timer easily.
	function initGameTime(ms) {
		liveSplit.TimeSpan.fromSeconds(0).with(t => timer.setLoadingTimes(t));
		timer.initializeGameTime();
		liveSplit.TimeSpan.fromSeconds((ms/1000)).with(t => timer.setGameTime(t));
	}
};

function msToTime(duration) {
	var seconds = parseInt((duration/1000)%60),
		minutes = parseInt((duration/(1000*60))%60),
		hours = parseInt((duration/(1000*60*60))%24);
	
	hours = (hours < 10) ? '0' + hours : hours;
	minutes = (minutes < 10) ? '0' + minutes : minutes;
	seconds = (seconds < 10) ? '0' + seconds : seconds;
	
	return hours + ':' + minutes + ':' + seconds;
}

function timeToMS(duration) {
	var ts = duration.split(':');
	if (ts.length === 2) ts.unshift('00'); // Adds 0 hours if they are not specified.
	return Date.UTC(1970, 0, 1, ts[0], ts[1], ts[2]);
}