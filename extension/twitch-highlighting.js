'use strict';
var clone = require('clone');
var moment = require('moment');
var async = require('async');
var gql = require('./twitch-gql');
var nodecg = require('./utils/nodecg-api-context').get();

// Don't run the code if the feature is not enabled or the OAuth isn't set in the config.
if (!nodecg.bundleConfig.twitch.highlighting || !nodecg.bundleConfig.twitch.highlighting.enable || !nodecg.bundleConfig.twitch.highlighting.gqlOAuth)
	return;

// Setting up replicants.
var highlightRecording = nodecg.Replicant('twitchHighlightRecording', {defaultValue:false});
var startTimestamp = nodecg.Replicant('twitchHighlightStartTimestamp', {defaultValue:null});
var highlightRunData = nodecg.Replicant('twitchHighlightRunData', {defaultValue:null});
var stopwatch = nodecg.Replicant('stopwatch');
var runDataActiveRun = nodecg.Replicant('runDataActiveRun');

// Ability to start the Twitch highlight recording.
// Listens for a message, either from the dashboard buttons or somewhere else.
nodecg.listenFor('startTwitchHighlight', () => {
	// Cannot start a highlight if one is already being recorded.
	if (highlightRecording.value)
		return;

	highlightRecording.value = true;
	startTimestamp.value = Math.floor(Date.now()/1000); // Store the current timestamp in seconds.
});

// Ability to stop the Twitch highlight recording.
// Listens for a message, either from the dashboard buttons or somewhere else.
nodecg.listenFor('stopTwitchHighlight', () => {
	// Cannot stop a highlight if one isn't being recorded, or if the timer is running/paused.
	if (!highlightRecording.value || stopwatch.value.state === 'running' || stopwatch.value.state === 'paused')
		return;

	highlightRecording.value = false;

	// If no run data was set during the recording, don't process it.
	if (!highlightRunData.value) {
		nodecg.log.warn('Twitch highlight will not be made due to no run being done during the recording.');
		return;
	}

	var endTimestamp = Math.floor(Date.now()/1000);
	createHighlight(startTimestamp.value, endTimestamp, clone(highlightRunData.value));
	cleanUp();
});

// Ability to cancel the Twitch highlight recording.
// Listens for a message, either from the dashboard buttons or somewhere else.
nodecg.listenFor('cancelTwitchHighlight', () => {
	highlightRecording.value = false;
	cleanUp();
});

// Store the currently set run when the timer starts, which we will use for the highlight info.
stopwatch.on('change', (newVal, oldVal) => {
	if (!highlightRunData.value && oldVal && oldVal.state === 'stopped' && newVal.state === 'running')
		highlightRunData.value = clone(runDataActiveRun.value);
});

// General clean up stuff, getting ready for the next highlight.
function cleanUp() {
	startTimestamp.value = null; // Clear last highlight's start timestamp.
	highlightRunData.value = null; // Clear last highlight's run data.
}

// Once the data is collected, it's passed to this function to do the main work.
function createHighlight(startTimestamp, endTimestamp, runData) {
	var streamCreatedAt;
	var pastBroadcastRecordedAt;
	var pastBroadcastID;
	
	async.waterfall([
		function(callback) {
			// Get the time the current stream was started.
			gql.getStreamCreatedTime(createdAt => {
				if (!createdAt)
					callback('no_stream');
				else {
					streamCreatedAt = moment.utc(createdAt);
					callback();
				}
			});
		},
		function(callback) {
			// Get most recent past broadcast recorded time and ID.
			gql.getMostRecentBroadcastData(data => {
				if (!data)
					callback('no_past_broadcast');
				else {
					pastBroadcastRecordedAt = moment.utc(data.recordedAt);
					pastBroadcastID = data.id;
					callback();
				}
			});
		}
	], function(err) {
		// If anything error'd above, stop.
		if (err) {
			if (err === 'no_stream')
				nodecg.log.warn('Twitch highlight will not be made because the stream is not live.');
			else if (err === 'no_past_broadcast')
				nodecg.log.warn('Twitch highlight will not be made because we cannot find the past broadcast.');
			return;
		}

		// If the most recent past broadcast isn't from the current stream, we want to stop.
		// We give it a 20s window because the timestamps might not be identical.
		if (pastBroadcastRecordedAt.diff(streamCreatedAt, 'seconds') > 20 || pastBroadcastRecordedAt.diff(streamCreatedAt, 'seconds') < -20) {
			nodecg.log.warn('Twitch highlight will not be made because we cannot find the past broadcast.');
			return;
		}

		// If the most recent past broadcast started *after* the highlight was started, we want to stop.
		// TODO: Actually support this and make 2 highlights?
		if (pastBroadcastRecordedAt.unix() > startTimestamp) {
			nodecg.log.warn('Twitch highlight will not be made because the last past broadcast started after the highlight recording.');
			return;
		}

		var startInPastBroadcast = (startTimestamp-pastBroadcastRecordedAt.unix())-10; // 10s padding.
		var endInPastBroadcast = (endTimestamp-pastBroadcastRecordedAt.unix())+10; // 10s padding.
		var highlightTitle = runData.game+' - '+runData.category; // TODO: Allow this to be customised.
		
		// Create highlight after a 30s delay to make sure Twitch has caught up.
		nodecg.log.info('Twitch highlight will be made in 30s.');
		setTimeout(() => {
			gql.createHighlight(pastBroadcastID, startInPastBroadcast, endInPastBroadcast, highlightTitle, (id) => {
				if (id)
					nodecg.log.info('Twitch highlight created successfully (ID: '+id+').');
				else
					nodecg.log.warn('Twitch highlight was not created successfully.');
			});
		}, 30000);
	});
}