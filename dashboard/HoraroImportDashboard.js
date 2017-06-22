'use strict';
$(function () {
// JQuery selectors..
    var $horaroURLField = $('#horaroImportURL');
    var $horaroCommitButton = $('#horaroImportCommit');
    var runDataArray = [];
    var runNumberIterator = 1;
// Local variables..

    $horaroCommitButton.button();
	
	// Fill in URL box with default if specified in the config file.
	if (typeof nodecg.bundleConfig !== 'undefined' && nodecg.bundleConfig.defaultScheduleURL)
		$horaroURLField.val(nodecg.bundleConfig.defaultScheduleURL);

    $horaroCommitButton.click(function () {
        if (!confirm("Importing will remove all the current runs added. Continue?")) {
            return;
        }

        runNumberIterator = 1;
		    runDataArray = [];
        var jsonURL = $horaroURLField.val() + ".json";
        $.ajax({
            url: jsonURL,
            dataType: "jsonp",
            success: function(data) {
                var runItems = data.schedule.items;
                var itemCounter = 0;
				async.eachSeries(runItems, function(run, callback) {
                    itemCounter++;
                    if(typeof run.data === 'undefined' ||
                       run.data == null ||
                       run.data[0] == null ||
                       run.data[1] == null ||
                       run.data[2] == null ||
                       run.data[3] == null) {
                       if(run.data == null) {
                           console.error("Did not receive a valid response from horaro. Has the format changed?");
                           return;
                       }

                       if(run.data[0] == null) {
                           console.error("Run Number " + itemCounter + " does not have any value for \"Game\". This is not ok, will not Import.");
                           return;
                       }

                       if(run.data[1] == null) {
                           console.warn("Run Number " + itemCounter + " does not have any value for \"Twitch User\". This might be ok, continuing import");
                       }

                       if(run.data[2] == null) {
                           console.warn("Run Number " + itemCounter + " does not have any value for \"System\". This might be ok, continuing import");
                       }

                       if(run.data[3] == null) {
                           console.warn("Run Number " + itemCounter + " does not have any value for \"Category\". This might be ok, continuing import");
                       }

                    }
					
                    var runData = createRunData();
					
					// Game Name
					// Checking to see if the game name is a link, if not use the whole field.
					if (run.data[0].match(/\((.*?)\)/)) 
						runData.game = run.data[0].match(/\[(.*?)\]/)[1];
					else
						runData.game = run.data[0];
					
					// Estimate
                    runData.estimate = msToTime(run.length_t);
					
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
                            var cap = rawTeam.match(/(Team\s*)?(\S+):\s+\[/);
                            if (cap !== null && cap.length > 0)
								var teamName = cap[2];
                            else
								var teamName = "Team "+(runData.teams.length+1);
							
							// Getting the members of this team.
                            var members = rawTeam.split(",");
                            var team = {
								name: teamName,
								members: new Array()
                            };
							
							// Going through the list of members.
							async.eachSeries(members, function(member, callback) {
								// Checking to see if the user is a link, if not use the whole field.
								if (member.match(/\((.*?)\)/)) {
									var username = member.match(/\((.*?)\)/)[1];
									var playerName = member.match(/\[(.*?)\]/)[1];
								}
								else
									var playerName = member;
								
								getRegionFromSpeedrunCom(playerName, username, function(regionCode) {
									// Creating the member object.
									var memberObj = {
										names: {
											international: playerName
										},
										twitch: {
											uri: username
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
							horaro_AddRun(runData);
							callback();
						});
                    }
					
					else {
						horaro_AddRun(runData);
						callback();
					}
                }, function(err) {
					horaro_finalizeRunList();
				});
            }
        });

    });

    // Returns an empty run object
    function createRunData() {
        var theRun = {};
        theRun.players = [];
        theRun.game = "";
        theRun.estimate = "";
        theRun.system = "";
        theRun.region = "";
        theRun.category = "";
        theRun.screens = new Array();
        theRun.cameras = new Array();
        theRun.teams = new Array();
        return theRun;
    }
	
	// Tries to find the specified user on speedrun.com and get their country/region.
	// Only using username lookups for now, need to use both in case 1 doesn't work.
	function getRegionFromSpeedrunCom(username, twitch, callback) {
		$.ajax({
			url: 'http://www.speedrun.com/api/v1/users?max=1&lookup='+username.toLowerCase(),
			dataType: "jsonp",
			success: function(data) {
				if (data.data.length > 0 && data.data[0].location) {
					if (data.data[0].location.region)
						callback(data.data[0].location.region.code);
					else
						callback(data.data[0].location.country.code);
				}
				
				else callback();
			}
		});
	}
	
// Called as a process when pushing the "add run" button
    function horaro_AddRun(runData) {
        runData.runID = runNumberIterator;
        runNumberIterator++;
        runDataArray.push(runData);
    }

    function horaro_finalizeRunList() {
        var runContainer = horaroRunDataArrayReplicant;
        runContainer.value = runDataArray;
        horaro_SetLastID();
    }

// All the runs have a uniqe ID attached to them
    function horaro_SetLastID() {
        horaroRunDataLastIDReplicant.value = runNumberIterator;
    }

// Initialize replicants we will use
    var horaroRunDataArrayReplicant = nodecg.Replicant("runDataArray");

    var horaroRunDataLastIDReplicant = nodecg.Replicant("runDataLastID");
    horaroRunDataLastIDReplicant.on("change", function (newValue, oldValue) {
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
})
