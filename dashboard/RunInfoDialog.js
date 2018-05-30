'use strict';
$(function() {
	// Declaring variables/replicants.
	var runDataArrayReplicant = nodecg.Replicant('runDataArray');
	var runDataActiveRunReplicant = nodecg.Replicant('runDataActiveRun');
	var runDataLastIDReplicant = nodecg.Replicant('runDataLastID');
	var defaultSetupTimeReplicant = nodecg.Replicant('defaultSetupTime', {defaultValue: 0});
	var runDataEditRunReplicant = nodecg.Replicant('runDataEditRun', {defaultValue: -1, persistent: false});
	var runInfo = {};
	var currentRunID = -1;
	var disableTeamEditing = false;
	
	// Dialog related elements for ease of access to change parts later.
	var dialogElement = $(nodecg.getDialog('run-info'));
	var dialogTitle = $('h2', dialogElement);
	var dialogConfirmButton = $('paper-button[dialog-confirm]', dialogElement);
	var dialogDismissButton = $('paper-button[dialog-dismiss]', dialogElement);
	
	// When the replicant used to store the run we want to edit is changed.
	runDataEditRunReplicant.on('change', (newVal, oldVal) => {
		disableTeamEditing = false;
		if (newVal === undefined || newVal === null) return;
		currentRunID = newVal;
		
		// If we want to add a new run, the value is -1.
		if (newVal < 0) {
			resetInputs();
			dialogTitle.text('Add New Run');
			dialogConfirmButton.text('add run');
		}
		
		else {
			dialogTitle.text('Edit Run');
			dialogConfirmButton.text('save changes');
			
			runInfo = runDataArrayReplicant.value[getRunIndexInRunDataArray(newVal)];
			$('#allPlayersInput').html(''); // Remove blank player data fields.
			
			// Populate fields with relevant data.
			$('#gameInput').val(runInfo.game);
			$('#gameShortInput').val(runInfo.gameShort);
			$('#gameTwitchInput').val(runInfo.gameTwitch);
			$('#categoryInput').val(runInfo.category);
			$('#estimateInput').val(runInfo.estimate);
			$('#systemInput').val(runInfo.system);
			$('#regionInput').val(runInfo.region);
			$('#setupTimeInput').val(runInfo.setupTime);
			
			// Currently only supporting the first runner in a team.
			var teamData = runInfo.teams;
			if (teamData.length === 0)
				$('#allPlayersInput').html('No Players');
			else if (teamData.length > 0 && teamData[0].members.length > 1) {
				disableTeamEditing = true;
				$('#allPlayersInput').html('Editing disabled for your safety while features are in development.');
			}
			else {
				for (var i = 0; i < teamData.length; i++) {
					var teamMembers = teamData[i].members;
					if (!teamMembers.length) continue;
					addRunnerFields(teamMembers[0]);
				}
			}
		}
	});
	
	// For when the "add/edit run" button is pressed.
	document.addEventListener('dialog-confirmed', () => {
		// Pulling data from the form to construct the run data object.
		var newRunData = {};
		
		newRunData.game = $('#gameInput').val();
		
		// Ghetto prompt if verification fails (for now).
		// Only picks up on checking if a game name is set; other things are just dropped for now.
		if (!newRunData.game.length) {
			alert('Run not saved because there was no game name provided.');
			return;
		}
		
		newRunData.gameShort = $('#gameShortInput').val();
		newRunData.gameTwitch = $('#gameTwitchInput').val();
		newRunData.category = $('#categoryInput').val();
		
		// Estimate processing.
		var estimate = $('#estimateInput').val();
		if (estimate.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/) || !isNaN(estimate)) {
			var estimateInMS = timeToMS($('#estimateInput').val());
			newRunData.estimate = msToTime(estimateInMS);
			newRunData.estimateS = estimateInMS/1000;
		}
		else {
			newRunData.estimate = msToTime(0);
			newRunData.estimateS = 0;
		}
		
		// Setup time processing.
		var setupTime = $('#setupTimeInput').val();
		if (setupTime.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/) || !isNaN(setupTime)) {
			var setupTimeInMS = timeToMS($('#setupTimeInput').val());
			newRunData.setupTime = msToTime(setupTimeInMS);
			newRunData.setupTimeS = setupTimeInMS/1000;
		}
		else {
			newRunData.setupTime = msToTime(0);
			newRunData.setupTimeS = 0;
		}
		
		newRunData.system = $('#systemInput').val();
		newRunData.region = $('#regionInput').val();
		newRunData.teams = [];
		newRunData.players = [];
		newRunData.screens = []; // unused
		newRunData.cameras = []; // unused
		
		if (!disableTeamEditing) {
			// Going through all the player detail inputs to continue the above.
			$('#allPlayersInput .playerInput').each(function(index) {
				var playerName = $(this).find('.playerNameInput').val();
				if (!playerName.length) return true; // Skip this player.
				
				// At some point we will try and pull these from speedrun.com.
				var twitchURI = $(this).find('.playerStreamInput').val();
				var region = $(this).find('.playerRegionInput').val();
				
				var team = {
					name: playerName,
					custom: false,
					members: []
				};
				
				var memberObj = {
					names: {
						international: playerName
					},
					twitch: {
						uri: (twitchURI.length)?twitchURI:undefined
					},
					team: team.name,
					region: (region.length)?region:undefined
				};
				
				team.members.push(memberObj);
				newRunData.players.push(memberObj);
				newRunData.teams.push(team);
			});
		}
		
		else {
			newRunData.players = runInfo.players;
			newRunData.teams = runInfo.teams;
		}
		
		// If we're adding a new run.
		if (currentRunID < 0) {
			newRunData.runID = runDataLastIDReplicant.value;
			runDataLastIDReplicant.value++;
			if (!runDataArrayReplicant.value) // If there we no runs yet, make the array.
				runDataArrayReplicant.value = [newRunData];
			else
				runDataArrayReplicant.value.push(newRunData);
		}
		
		// If an old run is being edited.
		else {
			newRunData.runID = runInfo.runID;
			runDataArrayReplicant.value[getRunIndexInRunDataArray(runInfo.runID)] = newRunData;
			
			// If the run being edited is the currently active run, update those details too.
			if (runDataActiveRunReplicant.value && runInfo.runID == runDataActiveRunReplicant.value.runID)
				runDataActiveRunReplicant.value = newRunData;
		}
		
		runDataEditRunReplicant.value = -1;
		resetInputs();
	});
	
	// When the cancel/close button is pressed.
	document.addEventListener('dialog-dismissed', () => {
		runDataEditRunReplicant.value = -1;
		resetInputs();
	});
	
	// Needs moving to a seperate file; this is copy/pasted in a few places.
	// Gets index of the run in the array by the unique ID given to the run.
	function getRunIndexInRunDataArray(runID) {
		if (!runDataArrayReplicant.value) return -1;
		for (var i = 0; i < runDataArrayReplicant.value.length; i++) {
			if (runDataArrayReplicant.value[i].runID === runID) {
				return i;
			}
		}
		return -1;
	}
	
	$('#addExtraRunnerButton').click(function() {
		addRunnerFields();
	});
	
	function addRunnerFields(runnerInfo) {
		var $playerInputs = '<span class="playerInput">';
		
		// Add line breaks if there is already more than 0 players.
		if ($('.playerInput').length > 0) $playerInputs += '<br><br>';
		
		// HTML for fields.
		$playerInputs += '<button type="button" class="removeRunnerButton">- Remove Player</button><input class="playerNameInput" placeholder="Player\'s Username"><input class="playerStreamInput" placeholder="Player\'s Stream URL (e.g. https://twitch.tv/trihex)"><input class="playerRegionInput" placeholder="Player\'s Country Code (e.g. SE)"></span>';
		
		$playerInputs = $($playerInputs);
		
		// If runner info was supplied to this function, fill it in.
		if (runnerInfo) {
			$playerInputs.find('.playerNameInput').val(runnerInfo.names.international);
			$playerInputs.find('.playerStreamInput').val(runnerInfo.twitch.uri);
			$playerInputs.find('.playerRegionInput').val(runnerInfo.region);
		}
		
		// Action to do when the "Remove Player" button is clicked.
		$('.removeRunnerButton', $playerInputs).click(event => {
			$(event.target).parent().remove();
			if ($('.playerInput').length === 0) $('#allPlayersInput').html('No Players');
			else if ($('.playerInput').length >= 1) $('.playerInput').first().find('br').remove();
		});
		
		$('#allPlayersInput').append($playerInputs);
	}
	
	// Reset form and inputs back to default.
	function resetInputs() {
		$('#gameDetailsInputs input').val('');
		$('#allPlayersInput').html('');
		if (defaultSetupTimeReplicant.value > 0)
			$('#setupTimeInput').val(msToTime(defaultSetupTimeReplicant.value*1000));
		$('#allPlayersInput').html('No Players');
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
});