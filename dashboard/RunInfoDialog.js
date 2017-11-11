'use strict';
$(function() {
	var runDataArrayReplicant = nodecg.Replicant('runDataArray');
	var runDataActiveRunReplicant = nodecg.Replicant('runDataActiveRun');
	var runDataLastIDReplicant = nodecg.Replicant('runDataLastID');
	var runInfo = {};
	var currentRunID = -1;
	
	var runDataEditRunReplicant = nodecg.Replicant('runDataEditRun', {defaultValue: -1, persistent: false});
	runDataEditRunReplicant.on('change', (newVal, oldVal) => {
		if (newVal === undefined || newVal === null) return;
		
		if (newVal < 0) {
			resetInputs();
		}
		
		else {
			currentRunID = newVal;
			runInfo = runDataArrayReplicant.value[getRunIndexInRunDataArray(newVal)];
			$('#allPlayersInput').html(''); // Remove blank player data fields.
			
			$('#gameInput').val(runInfo.game);
			$('#categoryInput').val(runInfo.category);
			$('#estimateInput').val(runInfo.estimate);
			$('#systemInput').val(runInfo.system);
			$('#regionInput').val(runInfo.region);
			$('#setupTimeInput').val(runInfo.setupTime);
			
			// Currently only supporting the first runner in a team.
			var teamData = runInfo.teams;
			for (var i = 0; i < teamData.length; i++) {
				var teamMembers = teamData[i].members;
				if (!teamMembers.length) continue;
				addRunnerFields(teamMembers[0]);
			}
		}
	});
	
	document.addEventListener('dialog-confirmed', () => {
		var estimateInMS = timeToMS($('#estimateInput').val());
		var setupTimeInMS = ($('#setupTimeInput').val().length) ? timeToMS($('#setupTimeInput').val()) : 0;
		
		var newRunData = {}
		newRunData.game = $('#gameInput').val();
		newRunData.category = $('#categoryInput').val();
		newRunData.estimate = msToTime(estimateInMS);
		newRunData.estimateS = estimateInMS/1000;
		newRunData.setupTime = msToTime(setupTimeInMS);
		newRunData.setupTimeS = setupTimeInMS/1000;
		newRunData.system = $('#systemInput').val();
		newRunData.region = $('#regionInput').val();
		newRunData.teams = [];
		newRunData.players = [];
		newRunData.screens = []; // unused
		newRunData.cameras = []; // unused
		
		$('#allPlayersInput .playerInput').each(function(index) {
			var playerName = $(this).find('.playerNameInput').val();
			if (!playerName.length) return true; // Skip this player.
			
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
					uri: ($(this).find('.playerStreamInput').val().length)?$(this).find('.playerStreamInput').val():undefined
				},
				team: team.name,
				region: ($(this).find('.playerRegionInput').val().length)?$(this).find('.playerRegionInput').val():undefined
			};
			
			team.members.push(memberObj);
			newRunData.players.push(memberObj);
			newRunData.teams.push(team);
		});
		
		// If we're adding a new run.
		if (currentRunID < 0) {
			newRunData.runID = runDataLastIDReplicant.value;
			runDataLastIDReplicant.value++;
			if (!runDataArrayReplicant.value)
				runDataArrayReplicant.value = [newRunData];
			else
				runDataArrayReplicant.value.push(newRunData);
		}
		
		// If an old run is being edited.
		else {
			newRunData.runID = runInfo.runID;
			runDataArrayReplicant.value[getRunIndexInRunDataArray(runInfo.runID)] = newRunData;
			if (runDataActiveRunReplicant.value && runInfo.runID == runDataActiveRunReplicant.value.runID)
				runDataActiveRunReplicant.value = newRunData;
		}
		
		runDataEditRunReplicant.value = -1;
		resetInputs();
	});
	
	document.addEventListener('dialog-dismissed', () => {
		runDataEditRunReplicant.value = -1;
		resetInputs();
	});
	
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
		// Add line breaks if there is already more than 0 players.
		if ($('#allPlayersInput').html().length) $('#allPlayersInput').append('<br><br>');
		
		// HTML for fields.
		var $playerInputs = $('<span class="playerInput"><input class="playerNameInput" placeholder="Player\'s Username"><input class="playerStreamInput" placeholder="Player\'s Stream URL (e.g. https://twitch.tv/trihex)"><input class="playerRegionInput" placeholder="Player\'s Country Code (e.g. SE)"></span>');
		
		// If runner info was supplied to this function, fill it in.
		if (runnerInfo) {
			$playerInputs.find('.playerNameInput').val(runnerInfo.names.international);
			$playerInputs.find('.playerStreamInput').val(runnerInfo.twitch.uri);
			$playerInputs.find('.playerRegionInput').val(runnerInfo.region);
		}
		
		$('#allPlayersInput').append($playerInputs);
	}
	
	function resetInputs() {
		$('#gameDetailsInputs input').val('');
		$('#allPlayersInput').html('');
		addRunnerFields();
	}
	
	function msToTime(duration) {
		var minutes = parseInt((duration/(1000*60))%60),
			hours = parseInt((duration/(1000*60*60))%24);
		
		hours = (hours < 10) ? '0' + hours : hours;
		minutes = (minutes < 10) ? '0' + minutes : minutes;
		
		return hours + ':' + minutes;
	}

	function timeToMS(duration) {
		var ts = duration.split(':');
		if (ts.length === 1) ts.unshift('00'); // Adds 0 hours if they are not specified.
		return Date.UTC(1970, 0, 1, ts[0], ts[1], 0);
	}
});