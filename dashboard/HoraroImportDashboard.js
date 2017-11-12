'use strict';
$(function() {
	var $horaroURLField = $('#horaroImportURL');
	var $horaroCommitButton = $('#horaroImportCommit');
	var runDataArray = [];
	var runNumberIterator = 1;
	var userDataCache = {}; // This is a *very* temp cache; it's gone once the page is refreshed.
	
	var defaultSetupTimeReplicant = nodecg.Replicant('defaultSetupTime', {defaultValue: 0});
	
	$horaroCommitButton.button();
	
	// Fill in URL box with default if specified in the config file.
	if (typeof nodecg.bundleConfig !== 'undefined' && nodecg.bundleConfig.defaultScheduleURL)
		$horaroURLField.val(nodecg.bundleConfig.defaultScheduleURL);
	
	// This is all of the importing stuff that happens when the button is pressed.
	$horaroCommitButton.click(function() {
		if (!confirm("Importing will remove all the current runs added. Continue?"))
			return;
		
		// Disable button and reset some variables.
		$horaroCommitButton.button({disabled: true, label:"Importing..."});
		runDataArray = [];
		runNumberIterator = 1;
		
		$.ajax({
			url: $horaroURLField.val() + ".json",
			dataType: "jsonp",
			success: function(data) {
				var runItems = data.schedule.items;
				var defaultSetupTime = data.schedule.setup_t;
				defaultSetupTimeReplicant.value = defaultSetupTime;
				var itemCounter = 0;
				
				async.eachSeries(runItems, function(run, callback) {
					itemCounter++;
					$horaroCommitButton.button({disabled: true, label:"Importing... ("+itemCounter+"/"+runItems.length+")"});
					
					// Check if the game name is part of the ignore list in the config.
					if (typeof run.data !== 'undefined' &&
						run.data !== null &&
						run.data[0] !== null &&
						checkGameAgainstIgnoreList(run.data[0])) {
						console.warn("Run Number " + itemCounter + " has a \"Game\" name that is blacklisted in your config file, will not import.");
						return callback();
					}
					
					// Checks to make sure this run isn't malformed in some way.
					if(typeof run.data === 'undefined' ||
						run.data == null ||
						run.data[0] == null ||
						run.data[1] == null ||
						run.data[2] == null ||
						run.data[3] == null) {
						if(run.data == null) {
							console.error("Did not receive a valid response from horaro. Has the format changed?");
							return callback();
						}
						
						// We won't import runs with no game name.
						if(run.data[0] == null) {
							console.error("Run Number " + itemCounter + " does not have any value for \"Game\". This is not ok, will not Import.");
							return callback();
						}
						
						// User
						if(run.data[1] == null) {
							console.warn("Run Number " + itemCounter + " does not have any value for \"User\". This might be ok, continuing import");
						}
						
						// System
						if(run.data[2] == null) {
							console.warn("Run Number " + itemCounter + " does not have any value for \"System\". This might be ok, continuing import");
						}
						
						// Category
						if(run.data[3] == null) {
							console.warn("Run Number " + itemCounter + " does not have any value for \"Category\". This might be ok, continuing import");
						}
					}
					
					var runData = createRunData();
					
					// Game Name
					// Checking to see if the game name is a link, if not use the whole field.
					if (run.data[0].match(/(?:__|[*#])|\[(.*?)\]\(.*?\)/))
						runData.game = run.data[0].match(/(?:__|[*#])|\[(.*?)\]\(.*?\)/)[1];
					else
						runData.game = run.data[0];
					
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
					if(run.data[3] !== null)
						runData.category = run.data[3];
					
					// System
					if(run.data[2] !== null)
						runData.system = run.data[2];
					
					// Teams/Players (there's a lot of stuff here!)
					var playerLinksList = run.data[1];
					
					if (playerLinksList !== null) {
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
					$horaroCommitButton.button({disabled: false, label:"Import"});
				});
			}
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