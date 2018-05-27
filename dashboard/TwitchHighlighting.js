'use strict';
$(() => {
	// If this feature is not enabled, do not display the controls.
	if (!nodecg.bundleConfig.twitch.highlighting || !nodecg.bundleConfig.twitch.highlighting.enable) {
		$('#controlWrapper').hide();
		$('#notEnabledText').show();
		return;
	}

	var highlightRecording = nodecg.Replicant('twitchHighlightRecording');
	var stopwatch = nodecg.Replicant('stopwatch');

	var startHighlightButton = $('#startHighlight');
	var stopHighlightButton = $('#stopHighlight');

	startHighlightButton.button();
	stopHighlightButton.button();

	highlightRecording.on('change', (newVal) => {
		// Only change buttons if run is currently not ongoing.
		if (stopwatch.value.state === 'stopped' || stopwatch.value.state === 'finished')
			toggleRecordingButtons(newVal)
	});

	stopwatch.on('change', (newVal, oldVal) => {
		// Only turn off buttons if run is currently ongoing.
		if (newVal.state === 'running' || newVal.state === 'paused') {
			startHighlightButton.button({disabled:true});
			stopHighlightButton.button({disabled:true});
		}

		// If the timer isn't running, set the buttons to what they should be.
		else
			toggleRecordingButtons(highlightRecording.value);
	});

	function toggleRecordingButtons(recording) {
		if (recording) {
			startHighlightButton.button({disabled:true});
			stopHighlightButton.button({disabled:false});
		}

		else {
			startHighlightButton.button({disabled:false});
			stopHighlightButton.button({disabled:true});
		}
	}

	startHighlightButton.click(() => {
		nodecg.sendMessage('startTwitchHighlight');
	});
	stopHighlightButton.click(() => {
		nodecg.sendMessage('stopTwitchHighlight');
	});
});
