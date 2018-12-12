var runDataCurrent, dialog, runID, runDataArray, defaultSetupTime, runDataLastID, runDataActiveRun, defaultRunDataObject, customData;

var runDataInputs = [
	{id: 'game', placeholder: 'Game'},
	{id: 'gameTwitch', placeholder: 'Game (Twitch)'},
	{id: 'category', placeholder: 'Category'},
	{id: 'estimate', placeholder: 'Estimate (HH:MM:SS)'},
	{id: 'system', placeholder: 'System'},
	{id: 'region', placeholder: 'Region'},
	{id: 'release', placeholder: 'Released'},
	{id: 'setupTime', placeholder: 'Setup Time (HH:MM:SS)'}
	//{id: 'customExample', placeholder: 'Custom Example', custom: true}
];

var playerDataInputs = [
	{id: 'name', placeholder: 'Name'},
	{id: 'twitch', placeholder: 'Twitch Username', social: true},
	{id: 'country', placeholder: 'Country Code'},
];

$(() => {
	dialog = nodecg.getDialog('run-info');
	runDataArray = nodecg.Replicant('runDataArray');
	defaultSetupTime = nodecg.Replicant('defaultSetupTime');
	runDataLastID = nodecg.Replicant('runDataLastID');
	runDataActiveRun = nodecg.Replicant('runDataActiveRun');
	defaultRunDataObject = nodecg.Replicant('defaultRunDataObject');
	customData = nodecg.bundleConfig.schedule.customData || [];

	customData.forEach((customDataElem) => {
		if (customDataElem.key && customDataElem.name) {
			runDataInputs.push({
				id: customDataElem.key,
				placeholder: customDataElem.name,
				custom: true
			});
		}
	});

	document.addEventListener('dialog-confirmed', () => {
		saveRun();
		cleanUp();
	});

	document.addEventListener('dialog-dismissed', () => {
		cleanUp();
	});
});

function loadRun(runIDtoLoad) {
	runID = runIDtoLoad;

	// If no ID is supplied, assume we want to add a new run.
	if (runID === undefined) {
		runDataCurrent = clone(defaultRunDataObject.value);

		$('h2', $(dialog)).text('Add New Run'); // Change Title
		$('paper-button[dialog-confirm]', $(dialog)).text('Add Run'); // Change Confirm Button

		// Add empty fields for run data.
		for (var i = 0; i < runDataInputs.length; i++) {
			if (runDataInputs[i].id !== 'setupTime')
				$('#gameDetailsInputs').append(`<input title='${runDataInputs[i].placeholder}' class='${runDataInputs[i].id}' placeholder='${runDataInputs[i].placeholder}'>`);
			else
				$('#gameDetailsInputs').append(`<input title='${runDataInputs[i].placeholder}' class='${runDataInputs[i].id}' placeholder='${runDataInputs[i].placeholder}' value='${msToTime(defaultSetupTime.value*1000)}'>`);
		}
	}

	// Else, we want to edit the run with the ID supplied.
	else {
		runDataCurrent = runDataArray.value[getRunIndexInRunDataArray(runID)];
		
		$('h2', $(dialog)).text('Edit Run'); // Change Title
		$('paper-button[dialog-confirm]', $(dialog)).text('Save Changes'); // Change Confirm Button

		// Add fields for run data, populated if the data is available.
		for (var i = 0; i < runDataInputs.length; i++) {
			if (runDataInputs[i].custom) var value = runDataCurrent.customData[runDataInputs[i].id];
			else var value = runDataCurrent[runDataInputs[i].id];

			$('#gameDetailsInputs').append(`<input title='${runDataInputs[i].placeholder}' class='${runDataInputs[i].id}' placeholder='${runDataInputs[i].placeholder}' value='${value}'>`);
		}

		runDataCurrent.teams.forEach((team, i) => {
			var teamElement = addTeam(team, i);
			team.members.forEach((member, i) => {
				teamElement.append(addPlayer(member, i));
			});
			$('#gameDetailsInputs').append(teamElement);
		});
	}
}

function saveRun() {
	var runData = clone(runDataCurrent);

	for (var i = 0; i < runDataInputs.length; i++) {
		var input = $(`.${runDataInputs[i].id}`).val();

		if (runDataInputs[i].custom)
			runData.customData[runDataInputs[i].id] = input;

		else if (runDataInputs[i].id === 'estimate' || runDataInputs[i].id === 'setupTime') {
			if (input.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/) || !isNaN(input)) {
				var ms = timeToMS(input);
				runData[runDataInputs[i].id] = msToTime(ms);
				runData[`${runDataInputs[i].id}S`] = ms/1000;
			}
		}

		else runData[runDataInputs[i].id] = input;
	}

	$('.team').each((teamIndex, teamElem) => {
		$('.player', teamElem).each((playerIndex, playerElem) => {
			for (var i = 0; i < playerDataInputs.length; i++) {
				var input = $(`.${playerDataInputs[i].id}`, playerElem).val();

				if (playerDataInputs[i].social)
					runData.teams[teamIndex].members[playerIndex].social[playerDataInputs[i].id] = input;
				else
					runData.teams[teamIndex].members[playerIndex][playerDataInputs[i].id] = input;
			}
		});
	});

	// If adding a new run.
	if (runID === undefined) {
		runData.runID = runDataLastID.value+1;
		runDataLastID.value++;
		runDataArray.value.push(runData);
	}

	// Else editing an old one.
	else {
		runDataArray.value[getRunIndexInRunDataArray(runData.runID)] = runData;

		// If the run being edited is the currently active run, update those details too.
		if (runDataActiveRun.value && runData.runID == runDataActiveRun.value.runID)
			runDataActiveRun.value = runData;
	}
}

function addTeam(teamData, i) {
	var teamElement = $(`<div class='team' id='${i}'>`);
	teamElement.append(`<div>Team ${i+1}`);
	return teamElement;
}

function addPlayer(playerData, i) {
	var playerElement = $(`<span class='player' id='${i}'>`);
	for (var i = 0; i < playerDataInputs.length; i++) {
		if (playerDataInputs[i].social) var value = playerData.social[playerDataInputs[i].id];
		else var value = playerData[playerDataInputs[i].id];
		playerElement.append(`<input title='${playerDataInputs[i].placeholder}' class='${playerDataInputs[i].id}' placeholder='${playerDataInputs[i].placeholder}' value='${value}'>`);
	}
	return playerElement;
}

function cleanUp() {
	$('#gameDetailsInputs').empty();
	runID = undefined;
	runData = undefined;
}

// Needs moving to a seperate file; this is copy/pasted in a few places.
// Gets index of the run in the array by the unique ID given to the run.
function getRunIndexInRunDataArray(runID) {
	if (!runDataArray.value) return -1;
	for (var i = 0; i < runDataArray.value.length; i++) {
		if (runDataArray.value[i].runID === runID) {
			return i;
		}
	}
	return -1;
}

// Needs moving to a seperate file; this is copy/pasted in a few places.
function msToTime(duration) {
	var minutes = parseInt((duration/(1000*60))%60),
		hours = parseInt((duration/(1000*60*60))%24),
		seconds = parseInt((duration/1000)%60);
	
	hours = (hours < 10) ? '0' + hours : hours;
	minutes = (minutes < 10) ? '0' + minutes : minutes;
	seconds = (seconds < 10) ? '0' + seconds : seconds;

	return hours + ':' + minutes + ':' + seconds;
}

// Needs moving to a seperate file; this is copy/pasted in a few places.
function timeToMS(duration) {
	var ts = duration.split(':');
	if (ts.length === 2) ts.unshift('00'); // Adds 0 hours if they are not specified.
	return Date.UTC(1970, 0, 1, ts[0], ts[1], ts[2]);
}