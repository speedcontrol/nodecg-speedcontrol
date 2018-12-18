var runDataCurrent,
	dialog,
	runID,
	runDataArray,
	defaultSetupTime,
	runDataLastID,
	runDataActiveRun,
	defaultRunDataObject,
	customData,
	defaultTeamObject,
	defaultPlayerObject,	
	runDataInputsContainer,
	teamsContainer;

// All possible general run data inputs available.
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

// All possible player data inputs available.
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
	runDataInputsContainer = $('#runDataInputs');
	teamsContainer = $('#teamsContainer');

	// Add custom data to the possible run data inputs.
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

	// Listener for the "Add Run/Save Changes" button.
	document.addEventListener('dialog-confirmed', () => {
		saveRun();
		cleanUp();
	});

	// Listener for the "Cancel" button, or clicking outside the dialog.
	document.addEventListener('dialog-dismissed', () => {
		cleanUp();
	});

	// The "Add Team" button will add the extra empty elements to the end.
	$('.addTeam').on('click', () => {
		var teamElement = addTeam();
		$('.playersContainer', teamElement).append(addPlayer());
		teamsContainer.append(teamElement);
		updateTeamTitles();
	});

	// The "Remove Team" buttons will delete the team element (and the players inside that).
	teamsContainer.on('click', '.removeTeam', (evt) => {
		$(evt.target).parent().parent().remove();
		updateTeamTitles();
	});

	// The up arrows next to the teams will move that team up the list.
	teamsContainer.on('click', '.moveTeamUp', (evt) => {
		var teamElem = $(evt.target).parent().parent();
		teamElem.prev().insertAfter(teamElem);
		updateTeamTitles();
	});

	// The down arrows next to the teams will move that team down the list.
	teamsContainer.on('click', '.moveTeamDown', (evt) => {
		var teamElem = $(evt.target).parent().parent();
		teamElem.next().insertBefore(teamElem);
		updateTeamTitles();
	});

	// The "Add Player" buttons will add an empty element.
	teamsContainer.on('click', '.addPlayer', (evt) => {
		$(evt.target).parent().parent().find('.playersContainer').append(addPlayer());
	});

	// The "X" button to the left of players will remove their element.
	teamsContainer.on('click', '.removePlayer', (evt) => {
		$(evt.target).parent().remove();
	});

	// The up arrows next to the players will move that player up the list.
	teamsContainer.on('click', '.movePlayerUp', (evt) => {
		var playerElem = $(evt.target).parent();
		playerElem.prev().insertAfter(playerElem);
	});

	// The down arrows next to the players will move that player down the list.
	teamsContainer.on('click', '.movePlayerDown', (evt) => {
		var playerElem = $(evt.target).parent();
		playerElem.next().insertBefore(playerElem);
	});
});

// This function is triggered from other panels.
function loadRun(runIDtoLoad) {
	runID = runIDtoLoad;

	// If no ID is supplied, assume we want to add a new run.
	if (runID === undefined) {
		runDataCurrent = clone(defaultRunDataObject.value);

		// Set default setup time.
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
		var inputElem = $(`<input title='${runDataInputs[i].placeholder}' class='${runDataInputs[i].id}' placeholder='${runDataInputs[i].placeholder}'>`);
		inputElem.val(value);
		runDataInputsContainer.append(inputElem);
	}

	// If we're editing a run, add the team/player fields.
	if (runID !== undefined) {
		runDataCurrent.teams.forEach(team => {
			var teamElement = addTeam(team);
			team.players.forEach(player => $('.playersContainer', teamElement).append(addPlayer(player)));
			teamsContainer.append(teamElement);
		});
	}

	// If adding a run, add a blank team with a blank player for ease of use.
	else {
		var teamElement = addTeam();
		$('.playersContainer', teamElement).append(addPlayer());
		teamsContainer.append(teamElement);
	}

	updateTeamTitles();
}

function saveRun() {
	var runData = clone(runDataCurrent);

	// Go through all the general run data inputs and grab their information.
	for (var i = 0; i < runDataInputs.length; i++) {
		var input = $(`.${runDataInputs[i].id}`).val();

		if (runDataInputs[i].custom)
			runData.customData[runDataInputs[i].id] = input;

		// Estimate/setup time needs checking to make sure it's valid and converting to seconds.
		else if (runDataInputs[i].id === 'estimate' || runDataInputs[i].id === 'setupTime') {
			if (input.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
				var ms = timeToMS(input);
				runData[runDataInputs[i].id] = msToTime(ms);
				runData[`${runDataInputs[i].id}S`] = ms/1000;
			}
		}

		else runData[runDataInputs[i].id] = input;
	}

	// For teams/players, we start from blank and redo the arrays.
	var newTeams = [];
	$('.team').each((i, teamElem) => {
		// If this is an existing team and we only need to edit their data.
		if ($(teamElem).data('id') !== undefined)
			var teamData = getTeamDataByID(runData, $(teamElem).data('id'));
		else {
			var teamData = clone(defaultTeamObject.value);
			teamData.id = runData.teamLastID+1;
			runData.teamLastID++;
		}

		teamData.name = $(`.name`, teamElem).val();

		var newPlayers = [];
		$('.player', teamElem).each((i, playerElem) => {
			// If this is an existing player and we only need to edit their data.
			if ($(playerElem).data('id') !== undefined)
				var playerData = getPlayerDataByID(teamData, $(playerElem).data('id'));
			else {
				var playerData = clone(defaultPlayerObject.value);
				playerData.id = runData.playerLastID+1;
				runData.playerLastID++;
				playerData.teamID = teamData.id;
			}
			
			// Go through player data inputs and grab their information.
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

	// If adding a new run, correctly set the ID and push.
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

// Used to add a team element, with populated information if available.
function addTeam(teamData) {
	if (!teamData) teamData = clone(defaultTeamObject.value);

	var teamElement = $(`<div class='team'>`);
	if (teamData.id > -1) teamElement.data('id', teamData.id);

	var teamHeader = $(`<div>`);
	teamHeader.append(`<button type="button" class="moveTeamUp">↑</button>`);
	teamHeader.append(`<button type="button" class="moveTeamDown">↓</button>`);
	teamHeader.append(`<span class="teamTitle">Team X`);
	teamHeader.append(`<button type="button" class="addPlayer">+ Add Player</button>`)
	teamHeader.append(`<button type="button" class="removeTeam">- Remove Team</button>`)
	var teamNameInput = $(`<input title='Team Name' class='name' placeholder='Team Name'>`);
	teamNameInput.val(teamData.name);
	teamHeader.append(teamNameInput);
	teamElement.append(teamHeader);
	teamElement.append(`<span class="playersContainer">`);

	return teamElement;
}

// Used to add a player element, with populated information if available.
function addPlayer(playerData) {
	if (!playerData) playerData = clone(defaultPlayerObject.value);

	var playerElement = $(`<span class='player'>`);
	if (playerData.id > -1) playerElement.data('id', playerData.id);

	playerElement.append(`<button type="button" class="movePlayerUp">↑</button>`);
	playerElement.append(`<button type="button" class="movePlayerDown">↓</button>`);
	playerElement.append(`<button type="button" class="removePlayer">X</button>`)
	for (var i = 0; i < playerDataInputs.length; i++) {
		if (playerDataInputs[i].social) var value = playerData.social[playerDataInputs[i].id];
		else var value = playerData[playerDataInputs[i].id];
		var input = $(`<input title='${playerDataInputs[i].placeholder}' class='${playerDataInputs[i].id}' placeholder='${playerDataInputs[i].placeholder}'>`);
		input.val(value);
		playerElement.append(input);
	}

	return playerElement;
}

// General clean up when we're done.
function cleanUp() {
	runDataInputsContainer.empty();
	teamsContainer.empty();
	runID = undefined;
	runDataCurrent = undefined;
}

// Used to keep the generic team titles always correct when things change around.
function updateTeamTitles() {
	$('.teamTitle').each((i, elem) => {
		$(elem).text(`Team ${i+1}`);
	});
}

// Get team object from provided run data.
function getTeamDataByID(runData, id) {
	if (!runData) return null;
	for (var i = 0; i < runData.teams.length; i++) {
		if (runData.teams[i].id === id) {
			return clone(runData.teams[i]);
		}
	}
	return null;
}

// Get player object from provided team data.
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