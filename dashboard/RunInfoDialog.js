var runDataCurrent, dialog, runID, runDataArray, defaultSetupTime, runDataLastID, runDataActiveRun, defaultRunDataObject, customData, defaultTeamObject, defaultPlayerObject;

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
	defaultTeamObject = nodecg.Replicant('defaultTeamObject');
	defaultPlayerObject = nodecg.Replicant('defaultPlayerObject');
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

	$('.addTeam').on('click', () => {
		var teamElement = addTeam();
		teamElement.append(addPlayer());
		$('#gameDetailsInputs').append(teamElement);
		updateTeamTitles();
	});

	$('#gameDetailsInputs').on('click', '.removeTeam', (evt) => {
		$(evt.target).parent().parent().remove();
		updateTeamTitles();
	});

	$('#gameDetailsInputs').on('click', '.addPlayer', (evt) => {
		$(evt.target).parent().parent().append(addPlayer());
	});

	$('#gameDetailsInputs').on('click', '.removePlayer', (evt) => {
		$(evt.target).parent().remove();
	});
});

function loadRun(runIDtoLoad) {
	runID = runIDtoLoad;

	// If no ID is supplied, assume we want to add a new run.
	if (runID === undefined) {
		runDataCurrent = clone(defaultRunDataObject.value);

		runDataCurrent.setupTime = msToTime(defaultSetupTime.value*1000);
		runDataCurrent.setupTimeS = defaultSetupTime.value*1000;

		$('h2', $(dialog)).text('Add New Run'); // Change Title
		$('paper-button[dialog-confirm]', $(dialog)).text('Add Run'); // Change Confirm Button
	}

	// Else, we want to edit the run with the ID supplied.
	else {
		runDataCurrent = runDataArray.value[getRunIndexInRunDataArray(runID)];
		
		$('h2', $(dialog)).text('Edit Run'); // Change Title
		$('paper-button[dialog-confirm]', $(dialog)).text('Save Changes'); // Change Confirm Button
	}

	// Add fields for run data, populated if the data is available.
	for (var i = 0; i < runDataInputs.length; i++) {
		if (runDataInputs[i].custom) var value = runDataCurrent.customData[runDataInputs[i].id];
		else var value = runDataCurrent[runDataInputs[i].id];

		$('#gameDetailsInputs').append(`<input title='${runDataInputs[i].placeholder}' class='${runDataInputs[i].id}' placeholder='${runDataInputs[i].placeholder}' value='${value}'>`);
	}

	// If we're editing a run, add the team/player fields.
	if (runID !== undefined) {
		runDataCurrent.teams.forEach((team, i) => {
			var teamElement = addTeam(team, i);
			team.players.forEach((player, i) => {
				teamElement.append(addPlayer(player, i));
			});
			$('#gameDetailsInputs').append(teamElement);
		});
	}

	// If adding a run, add a blank team with a blank player for ease of use.
	else {
		var teamElement = addTeam();
		teamElement.append(addPlayer());
		$('#gameDetailsInputs').append(teamElement);
	}

	updateTeamTitles();
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

	var newTeams = [];
	$('.team').each((teamIndex, teamElem) => {
		// If this is an existing team and we only need to edit their data.
		if ($(teamElem).data('id') !== undefined) {
			var teamData = getTeamDataByID($(teamElem).data('id'));
		}
		else {
			var teamData = clone(defaultTeamObject.value);
			teamData.id = runData.teamLastID+1;
			runData.teamLastID++;
		}

		teamData.name = $(`.name`, teamElem).val();

		var newPlayers = [];
		$('.player', teamElem).each((playerIndex, playerElem) => {
			if ($(playerElem).data('id') !== undefined) {
				var playerData = getPlayerDataByID(teamData, $(playerElem).data('id'));
			}
			else {
				var playerData = clone(defaultPlayerObject.value);
				playerData.id = runData.playerLastID+1;
				runData.playerLastID++;
				playerData.teamID = teamData.id;
			}
			
			for (var i = 0; i < playerDataInputs.length; i++) {
				var input = $(`.${playerDataInputs[i].id}`, playerElem).val();

				if (playerDataInputs[i].social)
					playerData.social[playerDataInputs[i].id] = input;
				else
					playerData[playerDataInputs[i].id] = input;
			}

			newPlayers.push(playerData);
		});

		// Don't add the team if there is 0 players.
		if (newPlayers.length) {
			teamData.players = newPlayers;
			newTeams.push(teamData);
		}
	});

	runData.teams = newTeams;

	// If adding a new run.
	if (runID === undefined) {
		runData.id = runDataLastID.value+1;
		runDataLastID.value++;
		runDataArray.value.push(runData);
	}

	// Else editing an old one.
	else {
		runDataArray.value[getRunIndexInRunDataArray(runData.id)] = runData;

		// If the run being edited is the currently active run, update those details too.
		if (runDataActiveRun.value && runData.id == runDataActiveRun.value.id)
			runDataActiveRun.value = runData;
	}
}

function addTeam(teamData, i) {
	if (!teamData) teamData = clone(defaultTeamObject.value);

	var teamElement = $(`<div class='team'>`);
	if (teamData.id > -1) teamElement.data('id', teamData.id);

	var teamHeader = $(`<div>`);
	teamHeader.append(`<span class="teamTitle">Team X`);
	teamHeader.append(`<button type="button" class="addPlayer">+ Add Player</button>`)
	teamHeader.append(`<button type="button" class="removeTeam">- Remove Team</button>`)
	teamHeader.append(`<input title='Team Name' class='name' placeholder='Team Name' value='${teamData.name}'>`);
	teamElement.append(teamHeader);
	return teamElement;
}

function addPlayer(playerData, i) {
	if (!playerData) playerData = clone(defaultPlayerObject.value);

	var playerElement = $(`<span class='player'>`);
	if (playerData.id > -1) playerElement.data('id', playerData.id);

	playerElement.append(`<button type="button" class="removePlayer">X</button>`)
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
	runDataCurrent = undefined;
}

function updateTeamTitles() {
	$('.teamTitle').each((i, elem) => {
		$(elem).text(`Team ${i+1}`);
	});
}

function getTeamDataByID(id) {
	if (!runDataCurrent) return null;
	for (var i = 0; i < runDataCurrent.teams.length; i++) {
		if (runDataCurrent.teams[i].id === id) {
			return clone(runDataCurrent.teams[i]);
		}
	}
	return null;
}

function getPlayerDataByID(teamData, id) {
	if (!teamData) return null;
	for (var i = 0; i < teamData.players.length; i++) {
		if (teamData.players[i].id === id) {
			return clone(teamData.players[i]);
		}
	}
	return null;
}

// Needs moving to a seperate file; this is copy/pasted in a few places.
// Gets index of the run in the array by the unique ID given to the run.
function getRunIndexInRunDataArray(id) {
	if (!runDataArray.value) return -1;
	for (var i = 0; i < runDataArray.value.length; i++) {
		if (runDataArray.value[i].id === id) {
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