// Code based off of stuff used for the SGDQ15 layouts.
// https://github.com/GamesDoneQuick/sgdq15-layouts/blob/master/extension/stopwatches.js

'use strict';
var Rieussec = require('rieussec');

module.exports = function(nodecg) {
	var defaultStopwatch = {time: '00:00:00', state: 'stopped', milliseconds: 0};
	var stopwatch = nodecg.Replicant('stopwatch', {defaultValue: defaultStopwatch});
	
	// If the timer was running when last closed, changes it to being paused.
	if (stopwatch.value.state === 'running') stopwatch.value.state = 'paused';
	
	// Load the existing time and start the stopwatch at that if needed/possible.
	var startMS = stopwatch.value.milliseconds | 0;
	
	// Set up the Rieussec timer.
	var rieussec = new Rieussec(1000);
	rieussec.setMilliseconds(startMS);
	
	// What to do on every "tick" (every 1s).
	// Updates the stored time in both formats.
	rieussec.on('tick', function(ms) {
		stopwatch.value.time = msToTime(ms);
		stopwatch.value.milliseconds = ms;
	});
	
	// Update the state of the timer whenever it changes.
	rieussec.on('state', function(state) {
		stopwatch.value.state = state;
	});
	
	nodecg.listenFor('startTime', function() {
		rieussec.start();
	});
	
	nodecg.listenFor('pauseTime', function() {
		rieussec.pause();
	});
	
	nodecg.listenFor('finishTime', function() {
		rieussec.pause();
		
		// Manually set a "finished" state when done.
		stopwatch.value.state = 'finished';
	});
	
	nodecg.listenFor('resetTime', function() {
		rieussec.reset();
	});
	
	nodecg.listenFor('setTime', function(time) {
		// Check to see if the time was given in the correct format and if it's stopped/paused.
		if (stopwatch.value.state === 'stopped' || stopwatch.value.state === 'paused'
		|| time.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
			// Pause the timer while this is being done.
			rieussec._cachedState = rieussec._state;
			rieussec.pause();
			
			rieussec.setMilliseconds(timeToMS(time));
			
			// If a timer was paused just for this, unpause it.
			if (rieussec._cachedState === 'running') rieussec.start();
		}
	});
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