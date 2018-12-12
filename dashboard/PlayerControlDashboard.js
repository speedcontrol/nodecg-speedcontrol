'use strict';
$(function () {
// JQuery selectors..
	var $addRunButton = $('#playerControlAddRunButton');
    var $removeRunsButton = $('#playerControlRemoveRunsButton');
    var $randomizeRunsButton = $('#playerControlRandomizeRunsButton');

// Initialize replicants we will use
    var runDataArrayReplicant = nodecg.Replicant("runDataArray");
	var runDataActiveRunReplicant = nodecg.Replicant("runDataActiveRun");
	
	var runDataLastIDReplicant = nodecg.Replicant("runDataLastID");
	
	// Initializes logic for buttons, fields, and validation
    function playerControl_InitializeElements() {
		$addRunButton.button({});
        $removeRunsButton.button({});
        $randomizeRunsButton.button({});
		
		$addRunButton.click(() => {
			nodecg.getDialog('run-info').querySelector('iframe').contentWindow.loadRun();
			nodecg.getDialog('run-info').open();
		});

        $removeRunsButton.click(function () {
            if (confirm("Really remove all runs?")) {
                runDataArrayReplicant.value = [];
                runDataLastIDReplicant.value = -1;
                runDataActiveRunReplicant.value = undefined;
            }
        });
    }

    // Initialize dashboard panel, only runs once
    playerControl_InitializeElements();
});
