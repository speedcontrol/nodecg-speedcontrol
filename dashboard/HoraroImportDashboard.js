'use strict';
$(function() {
	var $importSchedule = $('#importSchedule');
	var $loadScheduleData = $('#loadScheduleData');
	var $helpText = $('#loadHelpPrompt');
	var runDataArray = [];
	var runNumberIterator = 1;
	var scheduleData;
	var defaultSetupTimeReplicant = nodecg.Replicant('defaultSetupTime', {defaultValue: 0});
	
	// Temp cache for the user data from SR.com that is kept until the server is restarted.
	var userDataCache = nodecg.Replicant('horaroImportUserDataCache', {defaultValue: {}, persistent: false});
	
	$loadScheduleData.button();
	$importSchedule.button({disabled: true});
	$helpText.html('Insert the Horaro schedule URL above and press the "Load Schedule Data" button to continue.');
	
	// Fill in URL box with default if specified in the config file.
	if (nodecg.bundleConfig && nodecg.bundleConfig.schedule && nodecg.bundleConfig.schedule.defaultURL)
		$('#scheduleURL').val(nodecg.bundleConfig.schedule.defaultURL);
	
	// Initial load of the schedule data so the user can select the correct columns.
	$loadScheduleData.click(() => {
		$('#columnsDropdownsWrapper').html('');
		
		$.ajax({
			url: $('#scheduleURL').val()+'.json',
			dataType: 'jsonp',
			success: data => {
				scheduleData = data;
				var columns = data.schedule.columns;
				$helpText.html('Select the correct columns that match the data type below, if the one auto-selected is wrong.<br><br>');
				
				// What a nice mess.
				$('#columnsDropdownsWrapper').html('<div class="selectWrapper"><span class="selectName">Game:</span><span class="selectDropdown"><select id="gameColumns"></select></span></div><div class="selectWrapper"><span class="selectName">Category:</span><span class="selectDropdown"><select id="categoryColumns"></select></span></div><div class="selectWrapper"><span class="selectName">System:</span><span class="selectDropdown"><select id="systemColumns"></select></span></div><div class="selectWrapper"><span class="selectName">Region:</span><span class="selectDropdown"><select id="regionColumns"></select></span></div><div class="selectWrapper"><span class="selectName">Players:</span><span class="selectDropdown"><select id="playerColumns"></select></span></div>');
				
				// Adds a -1 N/A selection for if the column isn't on their schedule.
				$('#columnsDropdownsWrapper select').append($('<option>', { 
					value: -1,
					text : 'N/A'
				}));
				
				// Adds all other available columns as options to the dropdowns.
				$.each(columns, (i, column) => {
					$('#columnsDropdownsWrapper select').append($('<option>', {
						value: i,
						text : column
					}));
				});
				
				$importSchedule.button({disabled: false});
				
				// Here's where we try to lazily guess the correct columns using common names.
				for (var i = 0; i < columns.length; i++) {
					if (columns[i].toLowerCase().indexOf('game') >= 0) $('#gameColumns').val(i);
					if (columns[i].toLowerCase().indexOf('category') >= 0) $('#categoryColumns').val(i);
					if (columns[i].toLowerCase().indexOf('system') >= 0 || columns[i].toLowerCase().indexOf('platform') >= 0) $('#systemColumns').val(i);
					if (columns[i].toLowerCase().indexOf('region') >= 0) $('#regionColumns').val(i);
					if (columns[i].toLowerCase().indexOf('player') >= 0 || columns[i].toLowerCase().indexOf('runner') >= 0) $('#playerColumns').val(i);
				}
			}
		});
	});
	
	// This is all of the importing stuff that happens when the button is pressed.
	$importSchedule.click(() => {
		// The user must at least select something for the "Game" setting.
		if (parseInt($('#gameColumns').val()) < 0) {
			alert('At least the "Game" column must be set.');
			return;
		}
		
		// One last chance to cancel in case so people don't accidentally delete everything.
		if (!confirm('Importing will remove all the current runs added. Continue?'))
			return;
		
		//$.ajax({
			//url: $('#scheduleURL').val()+'.json',
			//dataType: 'jsonp',
			//success: data => {
				// Disable buttons and dropdowns and reset some variables.
				$importSchedule.button({disabled: true, label: 'Importing...'});
				$loadScheduleData.button({disabled: true});
				$('#columnsDropdownsWrapper select').prop('disabled', true);
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
				
				async.eachSeries(runItems, (run, callback) => {
					itemCounter++;
					$importSchedule.button({disabled: true, label: 'Importing... ('+itemCounter+'/'+runItems.length+')'});
					
					// Check if the game name is part of the ignore list in the config.
					if (run.data && run.data.length && gameColumn >= 0 && run.data[gameColumn] && checkGameAgainstIgnoreList(run.data[gameColumn])) {
						console.warn('Run Number ' + itemCounter + ' has a \'Game\' name that is blacklisted in your config file, will not import.');
						return callback();
					}
						
					// We won't import runs with no game name.
					if(!run.data[gameColumn] || run.data[gameColumn] === '') {
						console.error('Run Number ' + itemCounter + ' does not have any value for \'Game\'. This is not ok, will not Import.');
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
					if (run.options && run.options.setup && run.options.setup.indexOf('m') > 0) {
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
						var playerLinksList = run.data[playerColumn];
						
						// Splitting by ' vs. ' or ' vs ' in case this is a race.
						var vsList = playerLinksList.split(/\s+vs\.?\s+/);
						async.eachSeries(vsList, function(rawTeam, callback) {
							// Getting/setting the team name.
							var customTeamName = false;
							var cap = rawTeam.match(/(Team\s*)?(\S+):\s+\[/);
							if (cap !== null && cap.length > 0) {
								customTeamName = true;
								var teamName = cap[2];
							}
							else
								var teamName = 'Team '+(runData.teams.length+1);
							
							// Getting the members of this team.
							var members = rawTeam.split(/\s*,\s*/);
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
					$importSchedule.button({disabled: true, label:'Import'});
					$('#columnsDropdownsWrapper').html('');
					$helpText.html('Insert the Horaro schedule URL above and press the "Load Schedule Data" button to continue.');
					$loadScheduleData.button({disabled: false});
				});
			//}
		//});
	});
	
	// Returns an empty run object.
	function createRunData() {
		var theRun = {};
		theRun.players = [];
		theRun.game = '';
		theRun.estimate = '';
		theRun.estimateS = 0;
		theRun.setupTime = '';
		theRun.setupTimeS = 0;
		theRun.system = '';
		theRun.region = '';
		theRun.category = '';
		theRun.screens = new Array();
		theRun.cameras = new Array();
		theRun.teams = new Array();
		return theRun;
	}
	
	// Tries to find the specified user on speedrun.com and get their country/region and Twitch if needed.
	function getDataFromSpeedrunCom(username, twitch, callback) {
		if (userDataCache.value[username]) {
			extractInfoFromSRComUserData(userDataCache.value[username], (SRComRegion, SRComTwitch) => {
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
					userDataCache.value[username] = foundUserData;
					
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
			dataType: 'jsonp',
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
		if (data.location) {
			// For some reason the returned country sometimes includes something more precise which we don't really want, this strips that unless it's GB.
			var region = data.location.country.code;
			region = (region.indexOf('/') >= 0 && region.indexOf('GB') < 0) ? region.substr(0, region.indexOf('/')) : region;
			return region;
		}
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
		if (nodecg.bundleConfig && nodecg.bundleConfig.schedule && nodecg.bundleConfig.schedule.ignoreGamesWhileImporting) {
			var ignoredGames = nodecg.bundleConfig.schedule.ignoreGamesWhileImporting;
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
	var horaroRunDataArrayReplicant = nodecg.Replicant('runDataArray');
	
	var horaroRunDataLastIDReplicant = nodecg.Replicant('runDataLastID');
	horaroRunDataLastIDReplicant.on('change', function(newValue, oldValue) {
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