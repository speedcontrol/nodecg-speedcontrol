'use strict';
$(function() {
	var scheduleData;
	var $importSchedule = $('#importSchedule');
	var runDataArray = [];
	var runNumberIterator = 1;
	var userDataCache = {}; // This is a *very* temp cache; it's gone once the page is refreshed.
	var defaultSetupTimeReplicant = nodecg.Replicant('defaultSetupTime', {defaultValue: 0});
	
	$importSchedule.button();
	
	// Fill in URL box with default if specified in the config file.
	if (nodecg.bundleConfig && nodecg.bundleConfig.defaultScheduleURL)
		$('#scheduleURL').val(nodecg.bundleConfig.defaultScheduleURL);
	
	$('#loadScheduleData').click(() => {
		$.ajax({
			url: $('#scheduleURL').val()+".json",
			dataType: 'jsonp',
			success: function(data) {
				scheduleData = data;
				var columns = data.schedule.columns;
				
				$('#columnsDropdownsWrapper select').append($('<option>', { 
					value: -1,
					text : 'N/A'
				}));
				
				$.each(columns, (i, column) => {
					$('#columnsDropdownsWrapper select').append($('<option>', { 
						value: i,
						text : column
					}));
				});
			}
		});
	});
	
	// This is all of the importing stuff that happens when the button is pressed.
	$importSchedule.click(() => {
		if (!confirm("Importing will remove all the current runs added. Continue?"))
			return;
		
		// Disable button and reset some variables.
		$importSchedule.button({disabled: true, label:"Importing..."});
		runDataArray = [];
		runNumberIterator = 1;
		
		// Get column numbers from the dropdowns selected by the user.
		var gameColumn = parseInt($('#gameColumns').val());
		var categoryColumn = parseInt($('#categoryColumns').val());
		var systemColumn = parseInt($('#systemColumns').val());
		var regionColumn = parseInt($('#regionColumns').val());
		var playerColumn = parseInt($('#playerColumns').val());
		
		var runItems = scheduleData.schedule.items;
		var defaultSetupTime = scheduleData.schedule.setup_t;
		defaultSetupTimeReplicant.value = defaultSetupTime;
		var itemCounter = 0;
		
		async.eachSeries(runItems, function(run, callback) {
			itemCounter++;
			$importSchedule.button({disabled: true, label:"Importing... ("+itemCounter+"/"+runItems.length+")"});
			
			// Check if the game name is part of the ignore list in the config.
			if (run.data && run.data.length && gameColumn >= 0 && run.data[gameColumn] && checkGameAgainstIgnoreList(run.data[gameColumn])) {
				console.warn("Run Number " + itemCounter + " has a \"Game\" name that is blacklisted in your config file, will not import.");
				return callback();
			}
				
			// We won't import runs with no game name.
			if(!run.data[gameColumn] || run.data[gameColumn] === '') {
				console.error("Run Number " + itemCounter + " does not have any value for \"Game\". This is not ok, will not Import.");
				return callback();
			}
			
			var runData = createRunData();
			
			// Game Name
			if (gameColumn >= 0 && run.data[gameColumn]) {
				// Checking to see if the game name is a link, if not use the whole field.
				if (run.data[gameColumn].match(/(?:__|[*#])|\[(.*?)\]\(.*?\)/))
					runData.game = run.data[gameColumn].match(/(?:__|[*#])|\[(.*?)\]\(.*?\)/)[1];
				else
					runData.game = run.data[gameColumn];
			}
			
			// Estimate
			runData.estimateS = run.length_t;
			runData.estimate = msToTime(run.length_t);
			
			// If the run has a custom setup time, use that.
			if (run.options && run.options.setup) {
				// Kinda dirty right now; assumes the format is Xm (e.g. 15m).
				var setupSeconds = parseInt(run.options.setup.slice(0, -1))*60;
				runData.setupTime = msToTime(setupSeconds);
				runData.setupTimeS = setupSeconds;
			}
			
			else {
				runData.setupTime = msToTime(defaultSetupTime);
				runData.setupTimeS = defaultSetupTime;
			}
			
			// Category
			if(categoryColumn >= 0 && run.data[categoryColumn])
				runData.category = run.data[categoryColumn];
			
			// System
			if(systemColumn >= 0 && run.data[systemColumn])
				runData.system = run.data[systemColumn];
			
			// Region
			if (regionColumn >= 0 && run.data[regionColumn])
				runData.region = run.data[regionColumn];
			
			// Teams/Players (there's a lot of stuff here!)
			if (playerColumn >= 0 && run.data[playerColumn]) {
				var playerLinksList = run.data[1];
				
				// Splitting by 'vs.' in case this is a race.
				var vsList = playerLinksList.split(/vs\./);
				async.eachSeries(vsList, function(rawTeam, callback) {
					// Getting/setting the team name.
					var customTeamName = false;
					var cap = rawTeam.match(/(Team\s*)?(\S+):\s+\[/);
					if (cap !== null && cap.length > 0) {
						customTeamName = true;
						var teamName = cap[2];
					}
					else
						var teamName = "Team "+(runData.teams.length+1);
					
					// Getting the members of this team.
					var members = rawTeam.split(",");
					var team = {
						name: teamName,
						custom: customTeamName,
						members: new Array()
					};
					
					// Going through the list of members.
					async.eachSeries(members, function(member, callback) {
						// Checking to see if the user is a link, if not use the whole field.
						if (member.match(/(?:__|[*#])|\[(.*?)\]\(.*?\)/)) {
							var URI = member.match(/\((.*?)\)/)[1];
							var playerName = member.match(/\[(.*?)\]/)[1];
						}
						else
							var playerName = member;
						
						getDataFromSpeedrunCom(playerName, URI, function(regionCode, twitchURI) {
							// Creating the member object.
							var memberObj = {
								names: {
									international: playerName
								},
								twitch: {
									uri: twitchURI
								},
								team: team.name,
								region: regionCode
							};
							
							// Push this object to the relevant arrays where it is stored.
							team.members.push(memberObj);
							runData.players.push(memberObj);
							callback();
						});
					}, function(err) {
						// If there's only 1 member in the team, set the team name as their name.
						if (members.length === 1) {
							team.name = team.members[0].names.international;
							team.members[0].team = team.name;
						}
						
						runData.teams.push(team);
						callback();
					});
				}, function(err) {
					// Adding run if we have player(s) and we've checked them all.
					horaro_AddRun(runData);
					callback();
				});
			}
			
			else {
				// Adding run if we have no players.
				horaro_AddRun(runData);
				callback();
			}
		}, function(err) {
			horaro_finalizeRunList();
			$importSchedule.button({disabled: false, label:"Import"});
		});
	});
	
	// Returns an empty run object.
	function createRunData() {
		var theRun = {};
		theRun.players = [];
		theRun.game = "";
		theRun.estimate = "";
		theRun.estimateS = 0;
		theRun.setupTime = "";
		theRun.setupTimeS = 0;
		theRun.system = "";
		theRun.region = "";
		theRun.category = "";
		theRun.screens = new Array();
		theRun.cameras = new Array();
		theRun.teams = new Array();
		return theRun;
	}
	
	// Tries to find the specified user on speedrun.com and get their country/region and Twitch if needed.
	function getDataFromSpeedrunCom(username, twitch, callback) {
		if (userDataCache[username]) {
			extractInfoFromSRComUserData(userDataCache[username], (SRComRegion, SRComTwitch) => {
				callback(SRComRegion, SRComTwitch);
			});
		}
		
		else {
			var foundUserData;
			
			// Gets the actual "Twitch" username (should work for other sites too, not tested) from the URL.
			if (twitch) {
				twitch = twitch.split('/');
				twitch = twitch[twitch.length-1];
			}
			
			async.waterfall([
				function(callback) {
					if (twitch) {
						var url = 'https://www.speedrun.com/api/v1/users?max=1&lookup='+twitch.toLowerCase();
						
						querySRComForUserData(url, function(data) {
							if (data) foundUserData = data;
							callback();
						});
					}
					
					else callback();
				},
				function(callback) {
					if (!foundUserData) {
						var url = 'https://www.speedrun.com/api/v1/users?max=1&lookup='+username.toLowerCase();
						
						querySRComForUserData(url, function(data) {
							if (data) foundUserData = data;
							callback();
						});
					}
					
					else callback();
				}
			], function(err, result) {
				var foundRegion, foundTwitch;
				
				if (foundUserData) {
					// Store in the very temp cache if the user was found.
					userDataCache[username] = foundUserData;
					
					extractInfoFromSRComUserData(foundUserData, (SRComRegion, SRComTwitch) => {
						foundRegion = SRComRegion;
						foundTwitch = SRComTwitch;
					});
				}
				
				// 1 second delay on calling back so we don't stress the Speedrun.com API too much.
				setTimeout(function() {callback(foundRegion, foundTwitch);}, 1000);
			});
		}
	}
	
	// Helper function for above.
	function extractInfoFromSRComUserData(data, callback) {
		var regionCode = getUserRegionFromSRComUserData(data);
		var twitchURI = getTwitchFromSRComUserData(data);
		if (regionCode) var foundRegion = regionCode;
		if (twitchURI) var foundTwitch = twitchURI;
		callback(foundRegion, foundTwitch);
	}
	
	// Helper function for above.
	function querySRComForUserData(url, callback) {
		$.ajax({
			url: url,
			dataType: "jsonp",
			success: function(data) {
				if (data.data.length > 0)
					callback(data.data[0]);
				else
					callback();
			}
		});
	}
	
	// Helper function for above.
	function getUserRegionFromSRComUserData(data) {
		if (data.location)
			return data.location.country.code;
		else
			return false;
	}
	
	// Helper function for above.
	function getTwitchFromSRComUserData(data) {
		if (data.twitch && data.twitch.uri)
			return data.twitch.uri;
		else
			return false;
	}
	
	function checkGameAgainstIgnoreList(game) {
		// Checking if we have a list of games to ignore on the schedule.
		if (typeof nodecg.bundleConfig !== 'undefined' && nodecg.bundleConfig.ignoreGamesWhileImportingSchedule &&
			$.isArray(nodecg.bundleConfig.ignoreGamesWhileImportingSchedule)) {
			var ignoredGames = nodecg.bundleConfig.ignoreGamesWhileImportingSchedule;
			for (var i = 0; i < ignoredGames.length; i++) {
				var regex = new RegExp('\\b' + ignoredGames[i] + '\\b');
				if (game.match(regex)) return true;
			}
		}
		// If we reach here, the game is fine to be used.
		return false;
	}
	
	// Called as a process when pushing the "add run" button.
	function horaro_AddRun(runData) {
		runData.runID = runNumberIterator;
		runNumberIterator++;
		runDataArray.push(runData);
	}
	
	function horaro_finalizeRunList() {
		horaroRunDataArrayReplicant.value = runDataArray;
		horaro_SetLastID();
	}
	
	// All the runs have a unique ID attached to them.
	function horaro_SetLastID() {
		horaroRunDataLastIDReplicant.value = runNumberIterator;
	}
	
	// Initialize replicants we will use
	var horaroRunDataArrayReplicant = nodecg.Replicant("runDataArray");
	
	var horaroRunDataLastIDReplicant = nodecg.Replicant("runDataLastID");
	horaroRunDataLastIDReplicant.on("change", function(newValue, oldValue) {
		if (typeof newValue === 'undefined') {
			horaroRunDataLastIDReplicant.value = 1;
		}
	});
	
	function msToTime(duration) {
		var minutes = parseInt((duration / 60) % 60);
		var hours = parseInt(duration / (3600));
		
		hours = (hours < 10) ? '0' + hours : hours;
		minutes = (minutes < 10) ? '0' + minutes : minutes;
		
		return hours + ':' + minutes;
	}
});