'use strict';
var clone = require('clone');
var moment = require('moment');
var async = require('async');
var gql = require('./twitch-gql');
var nodecg = require('./utils/nodecg-api-context').get();

// Don't run the code if the feature is not enabled in the config.
if (!nodecg.bundleConfig.twitch.highlighting || !nodecg.bundleConfig.twitch.highlighting.enable)
	return;

// Don't run the code if the config is not set or is set incorrectly in the config.
if (!nodecg.bundleConfig.twitch.highlighting.gqlOAuth || nodecg.bundleConfig.twitch.highlighting.gqlOAuth === '') {
	nodecg.log.warn('Twitch highlights will not be active due to your OAuth not being set correctly in the config.');
	return;
}

// Get the OAuth user's ID to check the OAuth actually works.
gql.getCurrentUserID((err, id) => {
	if (err)
		nodecg.log.warn('Twitch highlights will not be active due to an issue with your OAuth.');
	else
		setUp();
});

// Setting up replicants.
var highlightRecording = nodecg.Replicant('twitchHighlightRecording', {defaultValue:false});
var startTimestamp = nodecg.Replicant('twitchHighlightStartTimestamp', {defaultValue:null});
var highlightRunData = nodecg.Replicant('twitchHighlightRunData', {defaultValue:null});
var highlightHistory = nodecg.Replicant('twitchHighlightHistory', {defaultValue:[]});
var highlightHistoryRaw = nodecg.Replicant('twitchHighlightHistoryRaw', {defaultValue:[]});
var highlightProcessing = nodecg.Replicant('twitchHighlightProcessing', {defaultValue:null, persistent:false});
var stopwatch = nodecg.Replicant('stopwatch');
var runDataActiveRun = nodecg.Replicant('runDataActiveRun');

function setUp() {
	nodecg.log.info('Twitch highlighting is enabled.');

	// Ability to start the Twitch highlight recording.
	// Listens for a message, either from the dashboard buttons or somewhere else.
	nodecg.listenFor('startTwitchHighlight', () => {
		// Cannot start a highlight if one is already being recorded, or if the timer is running/paused.
		if (highlightRecording.value || stopwatch.value.state === 'running' || stopwatch.value.state === 'paused')
			return;

		highlightRecording.value = true;
		startTimestamp.value = Math.floor(Date.now()/1000); // Store the current timestamp in seconds.
	});

	// Ability to stop the Twitch highlight recording.
	// Listens for a message, either from the dashboard buttons or somewhere else.
	nodecg.listenFor('stopTwitchHighlight', (data, callback) => {
		// Cannot stop a highlight if one isn't being recorded, or if the timer is running/paused.
		if (!highlightRecording.value || stopwatch.value.state === 'running' || stopwatch.value.state === 'paused') {
			if (callback) callback(true);
			return;
		}

		highlightRecording.value = false;

		// If no run data was set during the recording, don't process it.
		if (!highlightRunData.value) {
			nodecg.log.warn('Twitch highlight will not be made due to no run being done during the recording.');
			if (callback) callback(true);
			return;
		}

		var endTimestamp = Math.floor(Date.now()/1000);
		createHighlight(startTimestamp.value, endTimestamp, clone(highlightRunData.value));
		cleanUp();
		if (callback) callback(null);
	});

	// Ability to cancel the Twitch highlight recording.
	// Listens for a message, either from the dashboard buttons or somewhere else.
	nodecg.listenFor('cancelTwitchHighlight', () => {
		// Cannot cancel a highlight if one isn't being recorded, or if the timer is running/paused.
		if (!highlightRecording.value || stopwatch.value.state === 'running' || stopwatch.value.state === 'paused')
			return;

		highlightRecording.value = false;
		cleanUp();
	});

	// Store the currently set run when the timer first starts if a highlight is being recorded, which we will use for the highlight info.
	stopwatch.on('change', (newVal, oldVal) => {
		if (highlightRecording.value && !highlightRunData.value && oldVal && oldVal.state === 'stopped' && newVal.state === 'running')
			highlightRunData.value = clone(runDataActiveRun.value);
	});
}

// General clean up stuff, getting ready for the next highlight.
function cleanUp() {
	startTimestamp.value = null; // Clear last highlight's start timestamp.
	highlightRunData.value = null; // Clear last highlight's run data.
}

// Once the data is collected, it's passed to this function to do the main work.
function createHighlight(startTimestamp, endTimestamp, runData) {
	var streamCreatedAt;
	var streamID;
	var pastBroadcastRecordedAt;
	var pastBroadcastID;
	var gameID;
	
	async.waterfall([
		function(callback) {
			// Get the time the current stream was started.
			gql.getStreamInfo((err, createdAt, id) => {
				if (!createdAt)
					callback('no_stream');
				else {
					streamCreatedAt = moment.utc(createdAt);
					streamID = id;
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
		},
		function(callback) {
			// Get ID of game on Twitch if possible.
			// TODO: Use Twitch name from speedrun.com/schedule import too.
			gql.getGameID(runData.game, id => {
				if (id) {
					gameID = id;
					callback();
				}
				else
					callback();
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
		/*if (pastBroadcastRecordedAt.unix() > startTimestamp) {
			nodecg.log.warn('Twitch highlight will not be made because the last past broadcast started after the highlight recording.');
			return;
		}*/

		// Highlight starts from beginning of past broadcast if needed.
		// Temporary "fix".
		var startInPastBroadcast = 0;
		if (pastBroadcastRecordedAt.unix() < startTimestamp) {
			startInPastBroadcast = (startTimestamp-pastBroadcastRecordedAt.unix())-10; // 10s padding.
		}
		var endInPastBroadcast = (endTimestamp-pastBroadcastRecordedAt.unix())+10; // 10s padding.
		var highlightTitle = 'Game: {{game}} - Category: {{category}} - Players: {{players}}';

		if (nodecg.bundleConfig.twitch.highlighting.title)
			highlightTitle = nodecg.bundleConfig.twitch.highlighting.title;

		var playerNames = [];
		for (var i = 0; i < runData.players.length; i++) {
			playerNames.push(runData.players[i].names.international);
		}

		// Fill in the wildcards in the title.
		highlightTitle = highlightTitle
			.replace("{{game}}", runData.game)
			.replace("{{players}}", playerNames.join(', '))
			.replace("{{category}}", runData.category);

		// Add a part to the end of the title if this is a sponsored run.
		if (runData.customData && runData.customData.sponsored)
			highlightTitle += ' #sponsored';
			
		// Create highlight after a 30s delay to make sure Twitch has caught up.
		nodecg.log.info('Twitch highlight will be made in 30s.');
		highlightProcessing.value = highlightTitle;
		setTimeout(() => {
			gql.createHighlight(pastBroadcastID, startInPastBroadcast, endInPastBroadcast, highlightTitle, gameID, (id) => {
				if (id) {
					nodecg.log.info('Twitch highlight created successfully (ID: '+id+').');
					addHighlightToHistory(highlightTitle, id);
					highlightProcessing.value = null;
				}
				else
					nodecg.log.warn('Twitch highlight was not created successfully.');
			});
		}, 30000);

		// Also puts the highlight information into this permenant array, in case we fail to make it and need a reference.
		highlightHistoryRaw.value.push({
			pastBroadcastID: pastBroadcastID,
			startTimestamp: startInPastBroadcast,
			endTimestamp: endInPastBroadcast,
			title: highlightTitle,
			gameID: gameID
		});

		// Also make a bookmark (currently being tested).
		gql.createBookmark(streamID, '[END OF] '+highlightTitle, (id) => {
			if (id)
				nodecg.log.info('Twitch bookmark created successfully (ID: '+id+').');
			else
				nodecg.log.warn('Twitch bookmark was not created successfully.');
		});
	});
}

// Used to add a created highlight to the history array.
function addHighlightToHistory(title, id) {
	// Add run to front of array.
	var run = {
		title: title,
		url: 'https://www.twitch.tv/videos/'+id
	};
	var highlightHistoryCopy = highlightHistory.value.slice(0);
	highlightHistoryCopy.unshift(run);

	// Make sure the array stays capped at 4 highlights.
	highlightHistory.value = highlightHistoryCopy.slice(0, 4);
}