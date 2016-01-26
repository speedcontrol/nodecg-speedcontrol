$(function () {
    var runPlayer_activeRunID = -1;
    var runPlayer_neighbourRuns = {};
    var runPlayer_activeRunObject = undefined;
    var isInitialized = false;
    var syncGamePlayedToTwitch = false;
    var blankSlateRunContainerHtml = $('#run-player-container').html();
// Initialize replicants we will use
    var runDataArrayReplicantPlayer = nodecg.Replicant("runDataArray");
    runDataArrayReplicantPlayer.on("change", function (oldValue, newValue) {
        if (newValue != "") {
            runPlayer_updateList(newValue);
        }
        else {
            $('#runPlayerItems').html('');
        }
    });

    var streamControlConfigurationReplicantPlayer = nodecg.Replicant('streamControlConfiguration');
    streamControlConfigurationReplicantPlayer.on('change', function (oldVal, newVal) {
        if (newVal != "") {
            syncGamePlayedToTwitch = newVal.synchronizeAutomatically;
        }
    });

    var runDataActiveRunReplicant = nodecg.Replicant("runDataActiveRun");
    runDataActiveRunReplicant.on("change", function (oldValue, newValue) {
        if (!isInitialized && newValue != "") {
            isInitialized = true;
            if (typeof runPlayer_getRunObject(newValue.runID) !== 'undefined') {
                runPlayer_playRunIdOnly(newValue.runID, false);
            }
        }
        else {
        }
    });

    var runDataActiveRunRunnerListReplicant = nodecg.Replicant("runDataActiveRunRunnerList");
    runDataActiveRunRunnerListReplicant.on("change", function (oldValue, newValue) {
    });

    var stopWatchesReplicant = nodecg.Replicant('stopwatches');
    stopWatchesReplicant.on('change', function (oldVal, newVal) {
        if (!newVal) return;
        switch (newVal[0].state) {
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
        }
    });

    function enableRunChange() {
        $(".playRunButton").button({disabled: false});
        $(".runPlayerNext").button({disabled: false});
    }

    function disableRunChange() {
        $(".playRunButton").button({disabled: true});
        $(".runPlayerNext").button({disabled: true});
    }

    function runPlayer_getPlayers(runData) {
        var playerString = '<tr> <td class="rowTitle">Runners</td>';
        $.each(runData.players, function (index, player) {
            if (index == 0) {
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
        var bodyHtml = '<table class="table-striped">' +
            players +
            '<tr><td class="rowTitle">Estimate</td><td class="rowContent">' + runData.estimate + '</td></tr>' +
            '<tr><td class="rowTitle">Category</td><td class="rowContent">' + runData.category + '</td></tr>' +
            '<tr><td class="rowTitle">System</td><td class="rowContent">' + runData.system + '</td></tr>' +
            '<tr><td class="rowTitle">Region</td><td class="rowContent">' + runData.region + '</td></tr>' +
            '</table>' +
            '<button class="playRunButton" id="playRun' + runData.runID + '">play</button>';
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
        })
            .click(function () {
                nodecg.sendMessage("resetTime", 0);
                runPlayer_playRun($(this).attr('id'));
            });

        $(".runPlayerNext").button({
            text: true,
            icons: {
                primary: "ui-icon-seek-next"
            }
        }).click(function () {
            if(runDataArrayReplicantPlayer.value == "") {
                return;
            }
            var displayString = "Are you sure that you want to activate the run\n " + $(this).text().replace("Play ", "");
            if (confirm(displayString)) {
                nodecg.sendMessage("resetTime", 0);
                runPlayer_playNextRun();
            }
        });


        $(".runPlayerNext").button({
            disabled: true
        });
    }

    function runPlayer_playRun(id) {
        var runID = id.replace('playRun', '');
        runPlayer_playRunIdOnly(runID, true);
    }

    function runPlayer_playRunIdOnly(runID, updateActiveRunnerList) {
        var theNextGame = runPlayer_getRunObject(Number(Number(runID) + 1));
        runPlayer_activeRunID = runID;
        runPlayer_activeRunObject = runPlayer_getRunObject(runID);
        runPlayer_neighbourRuns = runPlayer_findNeighbourRuns(runID);
        $('.playerGroup').find('*').removeClass('ui-state-playing');
        $('.playerGroup').find('*').removeClass('ui-state-playing-next');
        $('#' + runID + ".playerGroup").find('h3').addClass('ui-state-playing');
        $('#' + Number(Number(runID) + 1) + ".playerGroup").find('h3').addClass('ui-state-playing-next');
        $("#runPlayerWindow").scrollTo($('#' + Number(Number(runID) - 1) + ".playerGroup"), 500, {queue: false});
        runDataActiveRunReplicant.value = runPlayer_activeRunObject;
        if (updateActiveRunnerList) {
            runDataActiveRunRunnerListReplicant.value = runPlayer_activeRunObject.players;
        }
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
        if (typeof nodecg.bundleConfig.user === 'undefined') {
            alert("If you want to use the twitch functionality, you need to create a file called nodecg-speedcontrol.json in nodecg/cfg and fill it with:\n" +
                "{\n" +
                "\"user\": \"username\"\n" +
                "}\n" +
                "exchange username with the twitch username which you want to access");
            return;
        }
        var methodString = "/channels/" + nodecg.bundleConfig.user + "/";
        Twitch.api({
            method: methodString, params: {
                "channel": {
                    "game": runData.game
                }
            },
            verb: 'PUT'
        }, function (resp, ans) {
            console.log(resp + " " + ans);
        });
    }

    function runPlayer_playNextRun() {
        var runToPlay = runPlayer_neighbourRuns.after;
        var runs = runDataArrayReplicantPlayer.value;
        runPlayer_playRunIdOnly(runs[Number(runToPlay)].runID, true);
    }

    function runPlayer_findNeighbourRuns(ID) {
        var runs = runDataArrayReplicantPlayer.value;
        var neighbours = {};
        neighbours.before = -1;
        neighbours.after = -1;

        $.each(runs, function (index, run) {
            if (run.runID == ID) {
                neighbours.before = index - 1;
                neighbours.after = index + 1;
                if (neighbours.before < 0) {
                    neighbours.before = runs.length - 1;
                }
                if (neighbours.after >= runs.length) {
                    neighbours.after = 0;
                }
            }
        });
        return neighbours;
    }

    function runPlayer_getRunObject(runIdToFind) {
        var runs = runDataArrayReplicantPlayer.value;
        var runFound = undefined;
        $.each(runs, function (index, value) {
            if (value.runID == runIdToFind) {
                runFound = value;
            }
        });
        return runFound;
    }

    $(".runPlayerNext").button({
        text: true
    }).click(function () {
        if(runDataArrayReplicantPlayer.value == "") {
            return;
        }
        nodecg.sendMessage("resetTime", 0);
        runPlayer_playNextRun()
    });

    $(".runPlayerNext").button({
        disabled: true
    });
})


