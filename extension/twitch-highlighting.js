'use strict';
var clone = require('clone');

module.exports = function(nodecg) {
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

		nodecg.log.debug('[twitch-highlighting] starting highlight');
		highlightRecording.value = true;
		startTimestamp.value = Math.floor(Date.now()/1000); // Store the current timestamp in seconds.
		nodecg.log.debug('[twitch-highlighting] highlight start timestamp is '+startTimestamp.value);
	});

	// Ability to stop the Twitch highlight recording.
	// Listens for a message, either from the dashboard buttons or somewhere else.
	nodecg.listenFor('stopTwitchHighlight', () => {
		// Cannot stop a highlight if one isn't being recorded, or if the timer is running/paused.
		if (!highlightRecording.value || stopwatch.value.state === 'running' || stopwatch.value.state === 'paused')
			return;

		nodecg.log.debug('[twitch-highlighting] stopping highlight');
		highlightRecording.value = false;

		if (!highlightRunData.value) {
			nodecg.log.debug('[twitch-highlighting] no run data was set during highlight, ignoring');
			return;
		}

		var endTimestamp = Math.floor(Date.now()/1000);
		nodecg.log.debug('[twitch-highlighting] highlight start timestamp is '+startTimestamp.value);
		nodecg.log.debug('[twitch-highlighting] highlight end timestamp is '+endTimestamp);
		nodecg.log.debug('[twitch-highlighting] highlight run is '+JSON.stringify(highlightRunData.value));
		nodecg.log.debug('[twitch-highlighting] highlight length is '+(endTimestamp-startTimestamp.value));

		cleanUp();
	});

	// Ability to cancel the Twitch highlight recording.
	// Listens for a message, either from the dashboard buttons or somewhere else.
	nodecg.listenFor('cancelTwitchHighlight', () => {
		nodecg.log.debug('[twitch-highlighting] cancelling highlight');
		highlightRecording.value = false;
		cleanUp();
	});

	// Store the currently set run when the timer starts, which we will use for the highlight info.
	stopwatch.on('change', (newVal, oldVal) => {
		if (!highlightRunData.value && oldVal && oldVal.state === 'stopped' && newVal.state === 'running') {
			nodecg.log.debug('[twitch-highlighting] storing current run data for use');
			highlightRunData.value = clone(runDataActiveRun.value);
		}
	});

	// General clean up stuff, getting ready for the next highlight.
	function cleanUp() {
		nodecg.log.debug('[twitch-highlighting] clean up done');
		startTimestamp.value = null; // Clear last highlight's start timestamp.
		highlightRunData.value = null; // Clear last highlight's run data.
	}
}