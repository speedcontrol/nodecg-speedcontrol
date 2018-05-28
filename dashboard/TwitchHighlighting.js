'use strict';
$(() => {
	// If this feature is not enabled, do not display the controls.
	if (!nodecg.bundleConfig.twitch.highlighting || !nodecg.bundleConfig.twitch.highlighting.enable) {
		$('#wrapper').hide();
		$('#notEnabledText').show();
		return;
	}

	// Setting up replicants.
	var highlightRecording = nodecg.Replicant('twitchHighlightRecording');
	var stopwatch = nodecg.Replicant('stopwatch');
	var highlightHistory = nodecg.Replicant('twitchHighlightHistory');

	// JQuery elements.
	var startHighlightButton = $('#startHighlight');
	var stopHighlightButton = $('#stopHighlight');
	var cancelHighlightButton = $('#cancelHighlight');
	var historyList = $('#history');
	var processingElem = $('#processing');
	var processingTitle = $('#processingTitle');

	// Turn the buttons into JQueryUI buttons.
	startHighlightButton.button();
	stopHighlightButton.button();
	cancelHighlightButton.button();

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
			cancelHighlightButton.button({disabled:true});
		}

		// If the timer isn't running, set the buttons to what they should be.
		else
			toggleRecordingButtons(highlightRecording.value);
	});

	function toggleRecordingButtons(recording) {
		if (recording) {
			startHighlightButton.button({disabled:true});
			stopHighlightButton.button({disabled:false});
			cancelHighlightButton.button({disabled:false});
		}

		else {
			startHighlightButton.button({disabled:false});
			stopHighlightButton.button({disabled:true});
			cancelHighlightButton.button({disabled:true});
		}
	}

	// Sending messages using the buttons.
	startHighlightButton.click(() => {
		nodecg.sendMessage('startTwitchHighlight');
	});
	stopHighlightButton.click(() => {
		nodecg.sendMessage('stopTwitchHighlight');
	});
	cancelHighlightButton.click(() => {
		nodecg.sendMessage('cancelTwitchHighlight');
	});

	// Message that tells us when a highlight is being processed (and also removed when done).
	nodecg.listenFor('twitchHighlightProcessing', title => {
		if (!title)
			processingElem.hide(); // this does not work for some reason?
		else
			processingTitle.html(title);
			processingElem.show();
	});
	
	// Updates the highlight history list when needed.
	highlightHistory.on('change', (newVal, oldVal) => {
		if (!newVal.length)
			historyList.html('<br>None yet.');
		else {
			var html = '';
			newVal.forEach(highlight => {
				html += '<br><a href="'+highlight.url+'">'+highlight.title+'</a><br>';
			});
			historyList.html(html);
		}
	});
});
