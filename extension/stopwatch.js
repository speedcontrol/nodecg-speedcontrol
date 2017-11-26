// Code based off of stuff used for the SGDQ15 layouts.
// https://github.com/GamesDoneQuick/sgdq15-layouts/blob/master/extension/stopwatches.js

'use strict';
module.exports = function(nodecg) {
	// Storage for the stopwatch data.
	var defaultStopwatch = {time: '00:00:00', state: 'stopped', milliseconds: 0};
	var stopwatch = nodecg.Replicant('stopwatch', {defaultValue: defaultStopwatch});
	
	// If the setting exists to use the external timer server.
	if (nodecg.bundleConfig && nodecg.bundleConfig.useExternalTimer) {
		nodecg.log.info('External timer server will be used.')
		var externalTimer = true;
		
		// Set up a connection to the server.
		var ipc = require('node-ipc');
		ipc.config.id = 'nodecg-speedcontrol';
		ipc.config.silent = true;
		ipc.connectTo('timer-speedcontrol', () => {
			ipc.of['timer-speedcontrol'].on('connect', () => {
				// Request the initial stopwatch object so we have an accurate one to start with.
				ipc.of['timer-speedcontrol'].emit('getStopwatchObj');
				ipc.of['timer-speedcontrol'].once('stopwatchObj', stopwatchObj => {
					stopwatchObj = JSON.parse(stopwatchObj);
					stopwatch.value = stopwatchObj;
				});
			});
			
			// Ticks are received every second, and contain the whole stopwatch object.
			ipc.of['timer-speedcontrol'].on('tick', stopwatchObj => {
				stopwatchObj = JSON.parse(stopwatchObj);
				stopwatch.value = stopwatchObj;
			});
			
			// If we are indicated of a state change in the timer, update that locally.
			ipc.of['timer-speedcontrol'].on('state', state => {
				stopwatch.value.state = state;
			});
		});
	}
	
	else {
		// If the timer was running when last closed, changes it to being paused.
		if (stopwatch.value.state === 'running') stopwatch.value.state = 'paused';
		
		// Load the existing time and start the stopwatch at that if needed/possible.
		var startMS = stopwatch.value.milliseconds || 0;
		
		// Set up the Rieussec timer.
		var Rieussec = require('rieussec');
		var rieussec = new Rieussec(1000);
		rieussec.setMilliseconds(startMS);
		
		// What to do on every "tick" (every 1s).
		// Updates the stored time in both formats.
		rieussec.on('tick', ms => {
			// "Workaround" for a bug that causes the time to appear slow.
			setTimeout(() => {
				stopwatch.value.time = msToTime(ms);
				stopwatch.value.milliseconds = ms;
			}, 0);
		});
		
		// Update the state of the timer whenever it changes.
		rieussec.on('state', state => {
			stopwatch.value.state = state;
		});
	}
	
	nodecg.listenFor('startTime', () => {
		if (externalTimer) ipc.of['timer-speedcontrol'].emit('startTime');
		else rieussec.start();
	});
	
	nodecg.listenFor('pauseTime', () => {
		if (externalTimer) ipc.of['timer-speedcontrol'].emit('pauseTime');
		else rieussec.pause();
	});
	
	nodecg.listenFor('finishTime', () => {
		if (externalTimer) ipc.of['timer-speedcontrol'].emit('finishTime');
		else {
			rieussec.pause();
			stopwatch.value.state = 'finished'; // Manually set a "finished" state when done.
		}
	});
	
	nodecg.listenFor('resetTime', () => {
		if (externalTimer) ipc.of['timer-speedcontrol'].emit('resetTime');
		else rieussec.reset();
	});
	
	nodecg.listenFor('setTime', time => {
		// Check to see if the time was given in the correct format and if it's stopped/paused.
		if (stopwatch.value.state === 'stopped' || stopwatch.value.state === 'paused'
		|| time.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
			if (externalTimer) ipc.of['timer-speedcontrol'].emit('setTime', time);
			else {
				// Pause the timer while this is being done.
				rieussec._cachedState = rieussec._state;
				rieussec.pause();
				
				rieussec.setMilliseconds(timeToMS(time));
				
				// If a timer was paused just for this, unpause it.
				if (rieussec._cachedState === 'running') rieussec.start();
			}
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