var runInfoDialog;

$(() => {
	runInfoDialog = nodecg.getDialog('run-info');
});

function loadRun(runID) {
	console.log(runID)
	// If no data is supplied, assume we want to add a new run.
	if (!runID) {
		$('h2', $(runInfoDialog)).text('Add New Run');
		$('paper-button[dialog-confirm]', $(runInfoDialog)).text('Add Run');
	}

	// Else, we want to edit the run with the ID supplied.
	else {
		$('h2', $(runInfoDialog)).text('Edit Run');
		$('paper-button[dialog-confirm]', $(runInfoDialog)).text('Save Changes');
	}
}