// Code based off of stuff used for the SGDQ15 layouts.
// https://github.com/GamesDoneQuick/sgdq15-layouts/blob/master/extension/stopwatches.js

'use strict';
var Rieussec = require('rieussec');

module.exports = function(nodecg) {
	var defaultStopwatch = {time: '00:00:00', state: 'stopped', milliseconds: 0};
	var stopwatch = nodecg.Replicant('stopwatch', {defaultValue: defaultStopwatch});
	
	// If the timer was running when last closed, changes it to being paused.
	if (stopwatch.value.state === 'running') stopwatch.value.state = 'paused';
	
	// Load the existing time and start the stopwatch at that if needed.
	var startMS = 0;
	if (stopwatch.value.time) {
		var ts = stopwatch.value.time.split(':');
		startMS = Date.UTC(1970, 0, 1, ts[0], ts[1], ts[2]);
	}
	
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