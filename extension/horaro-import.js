'use strict';
var nodecg = require('./utils/nodecg-api-context').get();
var needle = require('needle');
var async = require('async');

var runDataArray = [];
var runNumberIterator = 1;
var scheduleData;

var defaultSetupTimeReplicant = nodecg.Replicant('defaultSetupTime', {defaultValue: 0});
var horaroRunDataArrayReplicant = nodecg.Replicant('runDataArray');
var scheduleImporting = nodecg.Replicant('horaroScheduleImporting', {defaultValue:{importing:false,item:0,total:0}, persistent:false});

// Temp cache for the user data from SR.com that is kept until the server is restarted.
var userDataCache = nodecg.Replicant('horaroImportUserDataCache', {defaultValue: {}, persistent: false});

var customData = nodecg.bundleConfig.schedule.customData || [];

nodecg.listenFor('loadScheduleData', (url, callback) => {
	setScheduleData(url, () => callback(null, scheduleData));
});

nodecg.listenFor('importScheduleData', (columns, callback) => {
	nodecg.log.info('Horaro schedule import has started.');
	scheduleImporting.value.importing = true;
	scheduleImporting.value.item = 0;
	runDataArray = [];
	runNumberIterator = 1;

	var runItems = scheduleData.schedule.items;
	scheduleImporting.value.total = runItems.length;
	var defaultSetupTime = scheduleData.schedule.setup_t;
	defaultSetupTimeReplicant.value = defaultSetupTime;
	var itemCounter = 0;

	async.eachSeries(runItems, (run, callback) => {
		itemCounter++;
		scheduleImporting.value.item = itemCounter;
		
		// Check if the game name is part of the ignore list in the config.
		if (run.data && run.data.length && columns.game >= 0 && run.data[columns.game] && checkGameAgainstIgnoreList(run.data[columns.game])) {
			nodecg.log.warn('Run Number ' + itemCounter + ' has a \'Game\' name that is blacklisted in your config file, will not import.');
			return callback();
		}
			
		// We won't import runs with no game name.
		if(!run.data[columns.game] || run.data[columns.game] === '') {
			nodecg.log.error('Run Number ' + itemCounter + ' does not have any value for \'Game\'. This is not ok, will not Import.');
			return callback();
		}
		
		var runData = createRunData();
		
		// Game Name
		if (columns.game >= 0 && run.data[columns.game]) {
			// Checking to see if the game name is a link, if not use the whole field.
			if (run.data[columns.game].match(/(?:__|[*#])|\[(.*?)\]\(.*?\)/))
				runData.game = run.data[columns.game].match(/(?:__|[*#])|\[(.*?)\]\(.*?\)/)[1];
			else
				runData.game = run.data[columns.game];
		}
		
		// Game Twitch Name
		if (columns.gameTwitch >= 0 && run.data[columns.gameTwitch])
			runData.gameTwitch = run.data[columns.gameTwitch];
		
		// Scheduled date/time.
		runData.scheduledS = run.scheduled_t;
		runData.scheduled = run.scheduled;
		
		// Estimate
		runData.estimateS = run.length_t;
		runData.estimate = secondsToTime(run.length_t);
		
		// If the run has a custom setup time, use that.
		if (run.options && run.options.setup && run.options.setup.indexOf('m') > 0) {
			// Kinda dirty right now; assumes the format is Xm (e.g. 15m).
			var setupSeconds = parseInt(run.options.setup.slice(0, -1))*60;
			runData.setupTime = secondsToTime(setupSeconds);
			runData.setupTimeS = setupSeconds;
		}
		
		else {
			runData.setupTime = secondsToTime(defaultSetupTime);
			runData.setupTimeS = defaultSetupTime;
		}
		
		// Category
		if(columns.category >= 0 && run.data[columns.category])
			runData.category = run.data[columns.category];
		
		// System
		if(columns.system >= 0 && run.data[columns.system])
			runData.system = run.data[columns.system];
		
		// Region
		if (columns.region >= 0 && run.data[columns.region])
			runData.region = run.data[columns.region];
		
		// Custom Data
		// These are stored within the own object in the runData: "customData".
		Object.keys(columns.custom).forEach((col) => {
			runData.customData[col] = null; // Make sure the key is set for all runs.
			if (columns.custom[col] >= 0 && run.data[columns.custom[col]])
				runData.customData[col] = run.data[columns.custom[col]];
		});
		
		// Teams/Players (there's a lot of stuff here!)
		if (columns.player >= 0 && run.data[columns.player]) {
			var playerLinksList = run.data[columns.player];
			
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
					if (member.match(/(?:__|[*#])|\[(.*?)\]\(.*?\)/) && member.match(/\((.*?)\)/)) {
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
								uri: twitchURI || URI
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
		scheduleImporting.value.importing = false;
		nodecg.log.info('Horaro schedule import has successfully finished.');
		callback(null);
	});
});

function setScheduleData(url, callback) {
	needle.get(url+'.json', (err, resp) => {
		scheduleData = resp.body;
		callback();
	});
}

// Returns an empty run object.
function createRunData() {
	var runData = {};
	runData.players = [];
	runData.game = undefined;
	runData.gameTwitch = undefined;
	runData.estimate = undefined;
	runData.estimateS = 0;
	runData.setupTime = undefined;
	runData.setupTimeS = 0;
	runData.scheduled = undefined;
	runData.scheduledS = 0;
	runData.system = undefined;
	runData.region = undefined;
	runData.category = undefined;
	runData.screens = [];
	runData.cameras = [];
	runData.teams = [];
	runData.customData = {};
	return runData;
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
function querySRComForUserData(url, callback) {
	var success = false;
	async.whilst(
		function() {return !success},
		function(callback) {
			needle.get(url, (err, resp) => {
				if (!err) {
					success = true;
					if (resp.body.data.length > 0)
						callback(resp.body.data[0]);
					else
						callback();
				}
				else
					callback();
			});
		},
		callback
	);
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

var horaroRunDataLastIDReplicant = nodecg.Replicant('runDataLastID');
horaroRunDataLastIDReplicant.on('change', function(newValue, oldValue) {
	if (typeof newValue === 'undefined') {
		horaroRunDataLastIDReplicant.value = 1;
	}
});

function secondsToTime(duration) {
	var seconds = parseInt(duration % 60);
	var minutes = parseInt((duration / 60) % 60);
	var hours = parseInt(duration / (3600));
	
	hours = (hours < 10) ? '0' + hours : hours;
	minutes = (minutes < 10) ? '0' + minutes : minutes;
	seconds = (seconds < 10) ? '0' + seconds : seconds;
	
	return hours + ':' + minutes + ':' + seconds;
}