$(function () {
    var lastItemSize = 0;
	var blankSlateContainerHtml = $('#run-control-container').html();
	var customData = nodecg.bundleConfig.schedule.customData || [];
	
	// Initialize replicants we will use
    var runDataArrayReplicant = nodecg.Replicant("runDataArray");
    runDataArrayReplicant.on("change", function (newValue, oldValue) {
        if (typeof newValue !== 'undefined' && newValue != '') {
            runControl_UpdateList(newValue);
        }
        else {
            $('#runItems').html('');
        }
    });
	
	$('#editCurrentRunButton').button();

	var runDataLastID = nodecg.Replicant('runDataLastID');
	
	var runDataActiveRunReplicant = nodecg.Replicant('runDataActiveRun');
	runDataActiveRunReplicant.on('change', (newVal, oldVal) => {
		if (!newVal) $('#editCurrentRunButton').button({disabled: true});
		else $('#editCurrentRunButton').button({disabled: false});
	});
	
	$('#editCurrentRunButton').click(() => {
		editRun(runDataActiveRunReplicant.value.runID);
	});

	function runControl_GetPlayers(runData) {
		var shouldSayTeams = runData.teams.length > 1;
		// if any teams have more than 1 player, we should say teams
		runData.teams.forEach( function(team, index) {
			shouldSayTeams = team.players.length > 1;
		});
		var playerString = '<tr> <td class="rowTitle">'+ (shouldSayTeams ? 'Teams' : 'Players')+ '</td>';
		$.each(runData.teams, function (index, team) {
			if (index > 0) {
				playerString += '<tr><td class="rowTitle"></td>';
			}
			if (team.players.length > 1) {
				if (team.name) var teamName = team.name;
				else var teamName = `Team ${index+1}`
				playerString += `<td class="rowContent"> ${teamName}`;
			}
			else {
				playerString += `<td class="rowContent"> ${team.players[0].name}`;
			}
			if (team.players.length > 1) {
				playerString += '<ul>';

				$.each(team.players, function (index, player) {
					playerString += '<li>' + player.name + '</li>';
				});
				playerString += '</ul>'
			}
			playerString += '</td></tr>';
		});
		return playerString;
	}

    function runControl_GetRunBodyHtml(runData) {
        var players = runControl_GetPlayers(runData);
        var bodyHtml = '<table class="table-striped">'+players;
        if (runData.estimate) bodyHtml += '<tr><td class="rowTitle">Estimate</td><td class="rowContent">' + runData.estimate + '</td></tr>';
        if (runData.category) bodyHtml += '<tr><td class="rowTitle">Category</td><td class="rowContent">' + runData.category + '</td></tr>';
        if (runData.system) bodyHtml += '<tr><td class="rowTitle">System</td><td class="rowContent">' + runData.system + '</td></tr>';
        if (runData.region) bodyHtml += '<tr><td class="rowTitle">Region</td><td class="rowContent">' + runData.region + '</td></tr>';
		if (runData.release) bodyHtml += '<tr><td class="rowTitle">Released</td><td class="rowContent">' + runData.release + '</td></tr>';
		
		customData.forEach((customDataElem) => {
			if (customDataElem.key && customDataElem.name && runData.customData[customDataElem.key])
				bodyHtml += `<tr><td class="rowTitle">${customDataElem.name}</td><td class="rowContent">${runData.customData[customDataElem.key]}</td></tr>`;
		});

        bodyHtml += '</table>';
        return bodyHtml;
    }

    function runControl_UpdateList(runData) {
        var htmlDescriptor = '';
        var buttonRemoveIDs = [];
        var buttonChangeIDs = [];
        var buttonCloneIDs = [];

        $.each(runData, function (index, runData) {
            var buttonRemoveIDString = 'remove' + runData.runID;
            var buttonChangeIDString = 'change' + runData.runID;
            var buttonCloneIDString = 'clone' + runData.runID;
            buttonRemoveIDs.push(buttonRemoveIDString);
            buttonChangeIDs.push(buttonChangeIDString);
            buttonCloneIDs.push(buttonCloneIDString);
            teamsString = ( runData.teams.length > 1 ? ", " + runData.teams.length + " Teams" : "");
            htmlDescriptor += '<div class="group" id="' + runData.runID + '">' +
                '<h3>' + runData.game + ' (' + runData.category + ')' +
                '</h3>' +
                '<div>' +
                runControl_GetRunBodyHtml(runData) +
                '<button class="removeButton" id="' + buttonRemoveIDString + '"></button>' +
                '<button class="changeButton" id="' + buttonChangeIDString + '"></button>' +
                '<button class="cloneButton" id="' + buttonCloneIDString + '"></button>' +
                '</div>' +
                '</div>';
        });

        $('#run-control-container').html(blankSlateContainerHtml);
        $('#runItems').html(htmlDescriptor);

        $.each(buttonRemoveIDs, function (index, buttonID) {
            $('#' + buttonID).click(function () {
                var r = confirm("Do you really want to remove this run?");
                if (r) {
                    runControl_RemoveRun(index);
                }
            });

            $('#' + buttonID).button({
                icons: {
                    primary: "ui-icon-closethick"
                },
                text: false
            })
        });

        $.each(buttonChangeIDs, function (index, buttonID) {
            $('#' + buttonID).click(function () {
				editRun(runControl_GetRun(index).runID)
            });

            $('#' + buttonID).button({
                icons: {
                    primary: "ui-icon-pencil"
                },
                text: false
            })
		});
		
        $.each(buttonCloneIDs, function (index, buttonID) {
            $('#' + buttonID).click(function () {
				var clonedRunData = clone(runControl_GetRun(index));
				var newCategory = prompt('Change the category here if needed.', clonedRunData.category);
				if (newCategory) clonedRunData.category = newCategory; // Set new category if it was entered.
				clonedRunData.scheduled = '';
				clonedRunData.scheduledS = -1;
				clonedRunData.runID = runDataLastID.value+1;
				runDataLastID.value++;
				runDataArrayReplicant.value.splice(index+1, 0, clonedRunData);
            });

            $('#' + buttonID).button({
                icons: {
                    primary: "ui-icon-copy"
                },
                text: false
            })
        });

        $('#runItems')
            .accordion({
                header: "> div > h3",
                collapsible: true,
                active: false,
                heightStyle: "content"
            })
            .sortable({
                axis: "y",
                handle: "h3",
                stop: function (event, ui) {
                    // IE doesn't register the blur when sorting
                    // so trigger focusout handlers to remove .ui-state-focus
                    var sortedIDs = $('#runItems').sortable("toArray");
                    var runContainer = runDataArrayReplicant.value;
                    var newRunDataArray = [];
                    $.each(sortedIDs, function (index, valueId) {
                        $.each(runContainer, function (index, valueRunData) {
                            if (valueRunData.runID == valueId) {
                                newRunDataArray.push(valueRunData);
                                return false;
                            }
                        });
                    });
                    runDataArrayReplicant.value = newRunDataArray;
                    // Refresh accordion to handle new order
                    $(this).accordion("refresh");
                }
            });
        lastItemSize = runData.length;
    }

    function runControl_RemoveRun(ID) {
        var runContainer = runDataArrayReplicant.value;
        runContainer.splice(ID, 1);
        runDataArrayReplicant.value = runContainer;
    }

    function runControl_GetRun(ID) {
        var runContainer = runDataArrayReplicant.value;
        return runContainer[ID];
	}
	
	function editRun(runID) {
		nodecg.getDialog('run-info').querySelector('iframe').contentWindow.loadRun(runID);
		nodecg.getDialog('run-info').open();
	}
});