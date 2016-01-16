'use strict';

// JQuery selectors..
var $horaroURLField = $('#horaroImportURL');
var $horaroCommitButton = $('#horaroImportCommit');
var runDataArray = [];
var runNumberIterator = 1;
// Local variables..

$horaroCommitButton.button();

$horaroCommitButton.click(function() {
    if(!confirm("Importing will remove all the current runs added. Continue?")) {
        return;
    }

    runNumberIterator = 1;
    var jsonURL = $horaroURLField.val() + ".json";
    $.ajax({
        url: jsonURL,
        dataType: "jsonp",
        data: {
            q: {}
        },
        success: function( data ) {
            var runItems = data.schedule.items;
            runItems.forEach(function(run) {

                var runData = playerControl_CreateRunData();
                runData.game = run.data[0];
                runData.estimate = msToTime(run.length_t);
                runData.category = run.data[4];
                runData.system = run.data[3];
                runData.region = "";

                var twitchLinksList = run.data[2];
                if(twitchLinksList != null) {
                    twitchLinksList = twitchLinksList.split(",");
                }
                var runnerList = run.data[1].split(",");
                runnerList.forEach(
                    function(name, index){
                        var player = {};
                        player.names = {};
                        player.names.international = name.replace(' ','');
                        if(twitchLinksList != null && twitchLinksList[index] != null && twitchLinksList[index] != "") {
                            player.twitch = {};
                            player.twitch.uri = "http://www.twitch.tv/" + twitchLinksList[index].replace(' ', '');
                        }
                        runData.players.push(player);
                 });
                horaro_AddRun(runData);
            });
            horaro_finalizeRunList();
            playerControl_ClearAllFields();
        }
    });

});

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
horaroRunDataArrayReplicant.on("change", function (oldValue, newValue) {
});

var horaroRunDataLastIDReplicant = nodecg.Replicant("runDataLastID");
horaroRunDataLastIDReplicant.on("change", function (oldValue, newValue) {
    if(typeof newValue === 'undefined') {
        runDataLastIDReplicant.value = 1;
    }
});

function msToTime(duration) {
    var minutes = parseInt((duration/60)%60);
    var hours = parseInt(duration / (3600));

    hours = (hours < 10) ? '0' + hours : hours;
    minutes = (minutes < 10) ? '0' + minutes : minutes;

    return hours + ':' + minutes;
}

