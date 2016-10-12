'use strict';
$(function () {
// JQuery selectors..
    var $horaroURLField = $('#horaroImportURL');
    var $horaroCommitButton = $('#horaroImportCommit');
    var runDataArray = [];
    var runNumberIterator = 1;
// Local variables..

    $horaroCommitButton.button();

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
            data: {
                q: {}
            },
            success: function (data) {
                console.log(data);
                var runItems = data.schedule.items;
                var itemCounter = 0;
                runItems.forEach(function (run) {
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
                    runData.game = run.data[0];
                    runData.estimate = msToTime(run.length_t);
                    if(run.data[3] != null) {
                        runData.category = run.data[3];
                    }
                    else {
                        runData.category ="";
                    }

                    if(run.data[2] != null) {
                        runData.system = run.data[2];
                    }
                    else {
                        runData.system = "";
                    }

                    runData.region = "";

                    var playerLinksList = run.data[1];

                    if (playerLinksList != null) {
                        var vsList =playerLinksList.split(/vs\./);
                        vsList.forEach( function( rawTeam, index) {
                            var cap = rawTeam.match(/(Team\s*)?(\S+):\s+\[/);
                            var teamName = "";
                            if (cap !== null && cap.length > 0) {
                              teamName = cap[2];
                            }
                            else {
                              teamName = "Team "+(runData.teams.length+1);
                            }
                            var members = rawTeam.split(",");
                            var team = {
                              name: teamName,
                              members: new Array()
                            };

                            for (var i=0; i < members.length; i++) {

                              if (members[i].match(/\((.*?)\)/)) {
                                var username = members[i].match(/\((.*?)\)/)[1];
                                var playerName = members[i].match(/\[(.*?)\]/)[1];
                              }
                              else {
                                console.log("Unable to parse "+members[i]);
                              }
                              var member = {
                                  names: {
                                    international: playerName
                                  },
                                  twitch: {
                                    uri: username
                                  },
                                  team: team.name
                              };
                              team.members.push(member);
                              runData.players.push(member);
                            }
                            if (members.length == 1) {
                              team.name = team.members[0].names.international;
                              team.members[0].team = team.name;
                            }
                            runData.teams.push(team);
                        });
                    }
                    horaro_AddRun(runData);
                });
                horaro_finalizeRunList();
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
