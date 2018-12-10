$(function () {
    var runPlayer_activeRunID = -1;
    var runPlayer_neighbourRuns = {};
    var runPlayer_activeRunObject = undefined;
    var syncGamePlayedToTwitch = false;
	var changingEnabled = true;
    var blankSlateRunContainerHtml = $('#run-player-container').html();
	
    // Initialize replicants we will use
	
    var runDataArrayReplicantPlayer = nodecg.Replicant("runDataArray");
    runDataArrayReplicantPlayer.on("change", function (newValue, oldValue) {
        if (typeof newValue !== 'undefined' && newValue != "") {
            runPlayer_updateList(newValue);
            setActiveRun(runPlayer_activeRunID);
        }
        else {
            $('#runPlayerItems').html('');
			defaultNextRunButton();
        }
    });

    var streamControlConfigurationReplicantPlayer = nodecg.Replicant('streamControlConfiguration');
    streamControlConfigurationReplicantPlayer.on('change', function (newVal, oldVal) {
        if (typeof newVal !== 'undefined' && newVal != "") {
            syncGamePlayedToTwitch = newVal.synchronizeAutomatically;
        }
    });

    var runDataActiveRunReplicant = nodecg.Replicant("runDataActiveRun");
    runDataActiveRunReplicant.on("change", function (newValue, oldValue) {
        if (newValue != "" && typeof newValue !== 'undefined') {
            setActiveRun(newValue.runID);
        }
        else {
			runPlayer_activeRunID = -1;
        }
    });
	
	$('#resetMarathonButton').button();
	$('#resetMarathonButton').click(() => {
		if (!confirm('Are you sure you want to return to the start?'))
			return;
		
		runDataActiveRunReplicant.value = undefined;
		runPlayer_activeRunID = -1;
		setActiveRun(runPlayer_activeRunID);
	});

    var stopWatchReplicant = nodecg.Replicant('stopwatch');
    stopWatchReplicant.on('change', function (newVal, oldVal) {
        if (!newVal) return;
				var oldstate = "stopped";
				if (oldVal) {
					oldstate = oldVal.state;
				}
				if (oldstate != newVal.state) {
	        switch (newVal.state) {
	            case 'paused':
	                disableRunChange();
	                break;
	            case 'finished':
	                enableRunChange();
	                break;
	            case 'running':
	                disableRunChange();
	                break;
	            case 'stopped':
	                enableRunChange();
	                break;
	            default:
							break;
	        }
			  }
    });
	
	function enableRunChange() {
		$('.playRunButton').button( "option", "disabled", false );
		$('.runPlayerNext').button( "option", "disabled", false );
		$('#resetMarathonButton').button( "option", "disabled", false );
		changingEnabled = true;
	}
	
	function disableRunChange() {
		$('.playRunButton').button( "option", "disabled", true );
		$('.runPlayerNext').button( "option", "disabled", true );
		$('#resetMarathonButton').button( "option", "disabled", true );
		changingEnabled = false;
	}
	
	function runPlayer_getPlayers(runData) {
			var shouldSayTeams = runData.teams.length > 1;
			// if any teams have more than 1 player, we should say teams
			runData.teams.forEach( function(team, index) {
				shouldSayTeams = team.members.length > 1;
			});
			var playerString = '<tr> <td class="rowTitle">'+ (shouldSayTeams ? 'Teams' : 'Players')+ '</td>';
			$.each(runData.teams, function (index, team) {
				if (index > 0) {
					playerString += '<tr><td class="rowTitle"></td>';
				}
				if (team.members.length > 1) {
					if (runData.teamNames[team.ID]) var teamName = runData.teamNames[team.ID];
					else var teamName = `Team ${index+1}`
					playerString += `<td class="rowContent"> ${teamName}`;
				}
				else {
					playerString += `<td class="rowContent"> ${team.members[0].name}`;
				}
				if (team.members.length > 1) {
					playerString += '<ul>';

					$.each(team.members, function (index, member) {
						playerString += '<li>' + member.name + '</li>';
					});
					playerString += '</ul>'
				}
				playerString += '</td></tr>';
			});
			return playerString;
	}
	
    function runPlayer_getRunBodyHtml(runData) {
        var players = runPlayer_getPlayers(runData);
        var bodyHtml = '<table class="table-striped">'+players;
        if (runData.estimate) bodyHtml += '<tr><td class="rowTitle">Estimate</td><td class="rowContent">' + runData.estimate + '</td></tr>';
        if (runData.category) bodyHtml += '<tr><td class="rowTitle">Category</td><td class="rowContent">' + runData.category + '</td></tr>';
        if (runData.system) bodyHtml += '<tr><td class="rowTitle">System</td><td class="rowContent">' + runData.system + '</td></tr>';
        if (runData.region) bodyHtml += '<tr><td class="rowTitle">Region</td><td class="rowContent">' + runData.region + '</td></tr>';
        bodyHtml += '</table><button class="playRunButton" id="playRun' + runData.runID + '">play</button>';
        return bodyHtml;
    }

    function runPlayer_updateList(runData) {
        var htmlDescriptor = '';
        $.each(runData, function (index, runData) {
            htmlDescriptor += '<div class="playerGroup" id="' + runData.runID + '">' +
                '<h3>' + runData.game + ' (' + runData.category + ')' + " " + runData.players.length + "p" +
                '</h3>' +
                '<div>' +
                runPlayer_getRunBodyHtml(runData) +
                '</div>' +
                '</div>';
        });

        $('#run-player-container').html(blankSlateRunContainerHtml);
        $('#runPlayerItems').html(htmlDescriptor);

        $('#runPlayerItems')
            .accordion({
                header: "> div > h3",
                collapsible: true,
                active: false,
                heightStyle: "content"
            });
		
		$(".playRunButton").button({
			text: false,
			icons: {
				primary: "ui-icon-play"
			}
		}).click(function() {
			if (changingEnabled) {
				nodecg.sendMessage("resetTime");
				runPlayer_playRun($(this).attr('id'));
			}
		});
		
        $(".runPlayerNext").button({
            text: true,
            icons: {
                primary: "ui-icon-seek-next"
            }
        }).click(function () {
            if(!changingEnabled || runDataArrayReplicantPlayer.value == "") {
                return;
            }
			
			// Resets the timer
			nodecg.sendMessage("resetTime");

			// Loads the next run
			runPlayer_playNextRun();

        });


        $(".runPlayerNext").button({
            disabled: true
        });
    }

    function runPlayer_playRun(id) {
        var runID = id.replace('playRun', '');
        runPlayer_playRunIdOnly(runID, true);
    }

    function setActiveRun(runID) {
        var thisGameIndex = runPlayer_getRunIndexInArray(Number(runID));
        var nextGameArrayIndex = thisGameIndex + 1;
        var thePreviousGameIndex = thisGameIndex - 1;
        var theNextGame = runPlayer_getRunObjectByIndex(nextGameArrayIndex);
        runPlayer_activeRunObject = runPlayer_getRunObjectByIndex(thisGameIndex);
        runPlayer_activeRunID = runID;
        var thePreviousGame = runPlayer_getRunObjectByIndex(thePreviousGameIndex);
        $('.playerGroup').find('*').removeClass('ui-state-playing');
        $('.playerGroup').find('*').removeClass('ui-state-playing-next');
        $('#' + runID + ".playerGroup").find('h3').addClass('ui-state-playing');
        $('#' + theNextGame.runID + ".playerGroup").find('h3').addClass('ui-state-playing-next');
        $("#runPlayerWindow").scrollTo($('#' + thePreviousGame.runID + ".playerGroup"), 500, {queue: false});

        $(".runPlayerNext").button({
            text: true,
            label: theNextGame != null ? "Play " + theNextGame.game : "Loop back to the beginning",
            icons: {
                primary: "ui-icon-seek-next"
            }
        });

        $(".runPlayerNext").button({
            disabled: false
        });
    }

    function runPlayer_playRunIdOnly(runID, updateActiveRunnerList) {
        var thisGameIndex = runPlayer_getRunIndexInArray(Number(runID));
        var nextGameArrayIndex = thisGameIndex + 1;
        var thePreviousGameIndex = thisGameIndex - 1;
        var theNextGame = runPlayer_getRunObjectByIndex(nextGameArrayIndex);
        runPlayer_activeRunID = runID;
        runPlayer_activeRunObject = runPlayer_getRunObjectByIndex(thisGameIndex);
        var thePreviousGame = runPlayer_getRunObjectByIndex(thePreviousGameIndex);
        $('.playerGroup').find('*').removeClass('ui-state-playing');
        $('.playerGroup').find('*').removeClass('ui-state-playing-next');
        $('#' + runID + ".playerGroup").find('h3').addClass('ui-state-playing');
        $('#' + theNextGame.runID + ".playerGroup").find('h3').addClass('ui-state-playing-next');
        $("#runPlayerWindow").scrollTo($('#' + thePreviousGame.runID + ".playerGroup"), 500, {queue: false});
        runDataActiveRunReplicant.value = runPlayer_activeRunObject;


        if (syncGamePlayedToTwitch) {
            runPlayer_setTwitchChannelData(runPlayer_activeRunObject);
        }

        $(".runPlayerNext").button({
            text: true,
            label: theNextGame != null ? "Play " + theNextGame.game : "Loop back to the beginning",
            icons: {
                primary: "ui-icon-seek-next"
            }
        });

        $(".runPlayerNext").button({
            disabled: false
        });
    }

	function runPlayer_setTwitchChannelData(runData) {
		// Handles getting twitch directory metadata for the game
		getTwitchGameName(runData, function(twitchGameName) {
	 		var requestObject = {};
	 		requestObject.channel = {};

			// Because this is a callback, the game name should have already been found (look at function (getTwitchGameName))
	 		if (twitchGameName) {
				requestObject.channel.game = twitchGameName;
			} else {
				// Fallback to config default. Uses streamDefaultGame in bundle config if available, otherwise hard coded
				if (nodecg.bundleConfig && nodecg.bundleConfig.twitch && nodecg.bundleConfig.twitch.streamDefaultGame) {
					console.log("No automatic game data found - using default from configuration");
					requestObject.channel.game = nodecg.bundleConfig.twitch.streamDefaultGame;
				} else {
					console.log("No automatic game data found - please set streamDefaultGame in nodecg-speedcontrol.json");
					requestObject.channel.game = "Games + Demos";
				}

				// Alert the operator that a generic game name has been used
				alert("Twitch game has been set to default - please log onto the twitch dashboard and update this manually");
 			}

	 		// Gets Twitch channel names from the runData and puts them in an array to send to the FFZ WS script.
 			var twitchNames = [];
 			for (var i = 0; i < runData.players.length; i++) {
				var twitchName = runData.players[i].social.twitch;
				if (twitchName && !twitchName.match(/^http/)) {
					twitchNames.push(twitchName);
				}
 			}
			if (nodecg.bundleConfig && nodecg.bundleConfig.twitch && nodecg.bundleConfig.twitch.streamTitle) {
				var newTitle = nodecg.bundleConfig.twitch.streamTitle
													.replace("{{game}}",runData.game)
													.replace("{{players}}", formPlayerNamesString(runData))
													.replace("{{category}}", runData.category);

				requestObject.channel.status = newTitle;
			}

			// Fires off the arrays to the server to update FFZ and Twitch.
	 		nodecg.sendMessage('updateFFZFollowing', twitchNames);
 			nodecg.sendMessage('updateChannel', requestObject);
 		});
    }

	function getTwitchGameName(runData, callback) {
		// This routine searches Speedrun.com then Twitch APIs for an accurate directory name for a game.

		// Step 1: Speedrun.com exact match
		// This is the Twitch Game Name field on speedrun.com. You need supermod to update them (or give Pac some love)

		var twitchGameName;
		
		// If the imported data has a specified twitch game name, use that.
		if (runData.gameTwitch) {
			twitchGameName = runData.gameTwitch
		}
		else {
			$.ajax({
				url: "https://www.speedrun.com/api/v1/games?name=" + runData.game + "&limit=1",
				dataType: "jsonp",
				data: {
					q: runData.game
				},
				success: function(result) {
					// We look for an exact match (case insensitive) here so games like super metroid fall back to twitch search instead
					if ((result.data.length > 0) && (runData.game.toLowerCase() == result.data[0].name.toLowerCase())) {
						twitchGameName = result.data[0].names.twitch;
					} else {
						console.log ("No exact game match on speedrun.com for "+ runData.game);
						twitchGameName = '';
					}


				},
				error: function() {
					console.log("Warning: Speedrun.com API call failed")
				}
			});
		}

		// this is a dirty hard coded 2 second wait for SR.com data.
		setTimeout(function(){
			if (twitchGameName) {
				// If we found a result at step 1, call it back and stop
				console.log("Automatic game name data for "+ twitchGameName +" sourced from Speedrun.com API/schedule data.")
				callback(twitchGameName);
				return;

			} else {
				// Step 2: Twitch.
				// APIV3 fuzzy search. Uses game name of first result.
				// This is mostly a fallback to serve games like Super Metroid that aren't on SRcom at all.
				// For this we strip out punctuation and anything between brackets for more hits
				var string = runData.game;
				var string = string.replace(/\s*\(.*?\)\s*/g, ''); // between brackets
				var string = string.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,""); // specified punctuation
				var string = string.toLowerCase(); // like someone would type it manually

				console.log ("Twitch Search: " + string);
				nodecg.sendMessage('twitchGameSearch', string, function(replyData) {
					if (replyData) {
						// Send it away!
						console.log("Automatic game name data for "+ replyData +" sourced from Twitch API")
						callback(replyData);
						return;
					} else {
						// Sometimes there just isn't data :(
						callback(undefined);
						return;
					}
				});
			}
		},2000);
	  }
	  
	// Goes through each team and members and makes a string to show the names correctly together.
	function formPlayerNamesString(runData) {
		var namesArray = [];
		var namesList = 'No Runner(s)';
		runData.teams.forEach(team => {
			var teamMemberArray = [];
			team.members.forEach(member => {teamMemberArray.push(member.name);});
			namesArray.push(teamMemberArray.join(', '));
		});
		namesList = namesArray.join(' vs. ');
		return namesList;
	}

    function runPlayer_playNextRun() {
        var activeGame = runDataActiveRunReplicant.value;
        var nextGameIndex; try {nextGameIndex = runPlayer_getRunIndexInArray(activeGame.runID);} catch(e) {nextGameIndex = -1;}
        nextGameIndex++;
        if(nextGameIndex >= runDataArrayReplicantPlayer.value.length) {
            nextGameIndex = 0;
        }
        runPlayer_playRunIdOnly(runDataArrayReplicantPlayer.value[nextGameIndex].runID);
    }

    function runPlayer_getRunObjectByIndex(runIndex) {
        var runs = runDataArrayReplicantPlayer.value;
				if (typeof runs === 'undefined') {
					return -1;
				}
        if(runIndex >= runs.length) {
            runIndex = 0;
        }
        else if(runIndex < 0) {
            runIndex = 0;
        }
        if(typeof runs[runIndex] !== 'undefined') {
            return runs[runIndex];
        }
        return -1;
    }

    function runPlayer_getRunIndexInArray(runID) {
        var runs = runDataArrayReplicantPlayer.value;
        var foundIndex = -1;
        $.each(runs, function(index, run) {
            if(run.runID == runID) {
                foundIndex = index;
            }
        });
        return Number(foundIndex);
    }
	
	function defaultNextRunButton() {
		$(".runPlayerNext").button({
            text: true,
            label: 'No runs to play',
            icons: {
                primary: "ui-icon-seek-next"
            },
			disabled: true
        });
	}
});