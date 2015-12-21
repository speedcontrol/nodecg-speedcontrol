
var runPlayer_activeRunID = -1;
var runPlayer_neighbourRuns = {};
var runPlayer_activeRunObject = undefined;
var isInitialized = false;
var blankSlateRunContainerHtml = $('#run-player-container').html();
// Initialize replicants we will use
var runDataArrayReplicantPlayer = nodecg.Replicant("runDataArray");
runDataArrayReplicantPlayer.on("change", function (oldValue, newValue) {
    if(typeof newValue !== 'undefined') {
        runPlayer_updateList(newValue);
    }
    else {
        $('#runPlayerItems').html('');
    }
});

var runDataActiveRunReplicant = nodecg.Replicant("runDataActiveRun");
runDataActiveRunReplicant.on("change", function (oldValue, newValue) {
    if(!isInitialized && typeof newValue !== 'undefined') {
        isInitialized = true;
        if (typeof runPlayer_getRunObject(newValue.runID) !== 'undefined') {
            runPlayer_playRunIdOnly(newValue.runID);
        }
    }
    else {
    }
});

var runDataActiveRunRunnerListReplicant = nodecg.Replicant("runDataActiveRunRunnerList");
runDataActiveRunRunnerListReplicant.on("change", function (oldValue, newValue) {
});

function runPlayer_getPlayers(runData) {
    var playerString = '<tr> <td class="rowTitle">Runners</td>';
    $.each(runData.players, function(index, player) {
        if(index == 0) {
            playerString += '<td class="rowContent">' + player.names.international + '</td>' +
                '</tr>';
        }
        else {
            playerString += '<tr><td class="rowTitle"></td><td class="rowContent">' + player.names.international + '</td>' +
                '</tr>';
        }
    });
    return playerString;
}

function runPlayer_getRunBodyHtml(runData) {
    var players = runPlayer_getPlayers(runData);
    var bodyHtml = '<table class="table-striped">'+
        players +
        '<tr><td class="rowTitle">Estimate</td><td class="rowContent">' + runData.estimate + '</td></tr>' +
        '<tr><td class="rowTitle">Category</td><td class="rowContent">' + runData.category + '</td></tr>' +
        '<tr><td class="rowTitle">System</td><td class="rowContent">' + runData.system + '</td></tr>' +
        '<tr><td class="rowTitle">Region</td><td class="rowContent">' + runData.region + '</td></tr>' +
        '</table>' +
        '<button class="playRunButton" id="playRun'+runData.runID+'">play</button>';
    return bodyHtml;

}

function runPlayer_updateList(runData) {
    var htmlDescriptor = '';
    $.each(runData, function(index, runData) {
        htmlDescriptor += '<div class="playerGroup" id="' +runData.runID+ '">' +
            '<h3>' +runData.game+ ' (' +runData.category+ ')' +
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

    $( ".playRunButton" ).button({
        text: false,
        icons: {
            primary: "ui-icon-play"
        }
    })
        .click(function() {
            runPlayer_playRun($(this).attr('id'));
        });

    $( ".previous" ).button({
        text: false,
        icons: {
            primary: "ui-icon-seek-prev"
        }
    })
        .click(function() {
            runPlayer_playPreviousRun();
        });

    $( ".next" ).button({
        text: false,
        icons: {
            primary: "ui-icon-seek-next"
        }
    })
        .click(function() {
            runPlayer_playNextRun()
        });

    $( ".previous").button({
        disabled: true
    });
    $( ".next").button({
        disabled: true
    });
}

function runPlayer_playRun(id) {
    var runID = id.replace('playRun','');
    runPlayer_playRunIdOnly(runID);
}

function runPlayer_playRunIdOnly(runID) {
    runPlayer_activeRunID = runID;
    runPlayer_activeRunObject = runPlayer_getRunObject(runID);
    runPlayer_neighbourRuns = runPlayer_findNeighbourRuns(runID);
    $('.playerGroup').find('*').removeClass('ui-state-playing');
    $('#'+runID+".playerGroup").find('h3').addClass('ui-state-playing');
    runDataActiveRunReplicant.value = runPlayer_activeRunObject;
    runDataActiveRunRunnerListReplicant.value = runPlayer_activeRunObject.players;
    $( ".previous").button({
        disabled: false
    });
    $( ".next").button({
        disabled: false
    });
}

function runPlayer_playPreviousRun() {
    var runToPlay = runPlayer_neighbourRuns.before;
    var runs = runDataArrayReplicantPlayer.value;
    runPlayer_playRunIdOnly(runs[Number(runToPlay)].runID);
}

function runPlayer_playNextRun() {
    var runToPlay = runPlayer_neighbourRuns.after;
    var runs = runDataArrayReplicantPlayer.value;
    runPlayer_playRunIdOnly(runs[Number(runToPlay)].runID);
}

function runPlayer_findNeighbourRuns(ID) {
    var runs = runDataArrayReplicantPlayer.value;
    var neighbours = {};
    neighbours.before = -1;
    neighbours.after = -1;

    $.each(runs, function(index, run) {
        if(run.runID == ID) {
            neighbours.before = index-1;
            neighbours.after = index+1;
            if(neighbours.before < 0) {
                neighbours.before = runs.length - 1;
            }
            if(neighbours.after >= runs.length) {
                neighbours.after = 0;
            }
        }
    });
    return neighbours;
}

function runPlayer_getRunObject(runIdToFind) {
    var runs = runDataArrayReplicantPlayer.value;
    var runFound = undefined;
    $.each(runs, function(index, value) {
        if(value.runID == runIdToFind) {
            runFound = value;
        }
    });
    return runFound;
}

$( ".previous" ).button({
    text: false,
    icons: {
        primary: "ui-icon-seek-prev"
    }
})
    .click(function() {
        runPlayer_playPreviousRun();
    });

$( ".next" ).button({
    text: false,
    icons: {
        primary: "ui-icon-seek-next"
    }
})
    .click(function() {
        runPlayer_playNextRun()
    });

$( ".previous").button({
    disabled: true
});
$( ".next").button({
    disabled: true
});


