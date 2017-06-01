'use strict';
$(function () {
    var $timer = $("#theTimer");
    var splitsBeforeStoppingMainTimer = 255;
    var stoppedTimers = 0;
    var moreThanOneTeam = false;
    var splitTimes = [];
    var lastTimerState = "";
// Replicant initialization

    var stopWatchReplicant = nodecg.Replicant('stopwatch');
    stopWatchReplicant.on('change', function (newVal, oldVal) {
        if (!newVal) return;
        var time = newVal.time || '88:88:88';
        switch (newVal.state) {
            case 'paused':
                if(lastTimerState != newVal.state) {
                    $timer.css('color', '#555500');
                    disableMainTimerStopButton(true);
                    playerTimer_disablePersonalSplitButton(true);
                    playerTimer_disablePersonalResetButton(false);
                    disableMainResetButton(true);
                }
                break;
            case 'finished':
                if(lastTimerState != newVal.state) {
                    $timer.css('color', 'green');
                    disableMainTimerStopButton(true);
                    disableMainResetButton(false);
                    playerTimer_disablePersonalSplitButton(true);
                    playerTimer_disablePersonalResetButton(true);
					nodecg.sendMessage("forceRefreshIntermission");
                }
                break;
            case 'running':
                if(lastTimerState != newVal.state) {
                    $timer.css('color', '#008BB9');
                    if (moreThanOneTeam) {
                        disableMainTimerStopButton(true);
                    }
                    else {
                        disableMainTimerStopButton(false);
                    }
                    disableMainResetButton(true);
                    playerTimer_disablePersonalResetButton(false);
                    playerTimer_disablePersonalSplitButton(false);
                    setPlayButtonToPauseButton();
                }
                break;
            case 'stopped':
                if(lastTimerState != newVal.state) {
                    disableMainTimerStopButton(true);
                    disableMainResetButton(true);
                    playerTimer_disablePersonalResetButton(false);
                    playerTimer_disablePersonalSplitButton(true);
                    $timer.css('color', 'gray');
                }
                break;
            default:
        }
        lastTimerState = newVal.state;
        playerTimer_SetTime(time);
    });

    var runDataActiveRunReplicant = nodecg.Replicant("runDataActiveRun");
    runDataActiveRunReplicant.on('change', function( newValue, oldValue) {
        if( typeof newValue !== 'undefined' && newValue !== '' ) {
            moreThanOneTeam = newValue.teams.length > 1;
              //|| (newValue.players.length >=2) && newValue.teams.length == 1);
            playerTimer_UpdateTimers(newValue);
        }
    });

    var runDataActiveRunRunnerListReplicant = nodecg.Replicant("runDataActiveRunRunnerList");
    // runDataActiveRunRunnerListReplicant.on("change", function (newValue, oldValue) {
    //     if (typeof newValue !== 'undefined' && newValue != '' ) {
    //         if (typeof runDataActiveRunReplicant.value !== 'undefined') {
    //           playerTimer_UpdateTimers(runDataActiveRunReplicant.value);
    //         }
    //
    //     }
    // });

    var finishedTimersReplicant = nodecg.Replicant('finishedTimers');
    finishedTimersReplicant.on('change', function(newValue, oldValue) {
        if(typeof newValue != 'undefined' && newValue != '') {
            if(splitTimes.length != newValue.length) {
                splitTimes = newValue;
                updateSplitTimerTextColor(newValue);
            }
        }
    });

    var activeRunStartTime = nodecg.Replicant('activeRunStartTime');

    function updateSplitTimerTextColor(timerArray) {
        $.each(timerArray, function(index, value){
            $('#toolbar'+value.index).css('color','#0000dd');
        });
    }

    function resetSplitTimerTextColor(index) {
        $('#toolbar'+index).css('color','white');
    }

    function resetSplitTimes() {
        finishedTimersReplicant.value = [];
        splitTimes = [];
        resetSplitTimerTextColor(0);
        resetSplitTimerTextColor(1);
        resetSplitTimerTextColor(2);
        resetSplitTimerTextColor(3);
        activeRunStartTime.value = 0;
    }

    function splitTimer(splitIndex) {
        var found = false;
        $.each(splitTimes, function(index, value){
            if(value.index == splitIndex) {
                found = true;
                value.time = stopWatchReplicant.value.time;
            }
        });
        if(!found) {
            var newSplit = createSplitTime(splitIndex);
            splitTimes.push(newSplit);
        }
        stoppedTimers = splitTimes.length;

        if (stoppedTimers >= splitsBeforeStoppingMainTimer) {
            nodecg.sendMessage("finishTime");
            nodecg.sendMessage("runEnded")
        }

        finishedTimersReplicant.value = splitTimes;

        $('#toolbar'+splitIndex).css('color','#0000dd');
    }

    function unSplitTimer(splitIndex) {
        var removeIndex = -1;
        $.each(splitTimes, function(index, value){
            if(value.index == splitIndex) {
                removeIndex = index;
                return;
            }
        });

        if(removeIndex != -1) {
            splitTimes.splice(removeIndex, 1);
            finishedTimersReplicant.value = splitTimes;
            resetSplitTimerTextColor(splitIndex);
        }
    }

    function createSplitTime(index) {
        var splitTime = {};
        splitTime.index = index;
        splitTime.time = stopWatchReplicant.value.time;
        splitTime.name = runDataActiveRunReplicant.value.teams[index].name;
        return splitTime;
    }

    function setPlayButtonToPauseButton() {
		$('#play').button();
        var options = {
            label: "pause",
            icons: {
                primary: "ui-icon-pause"
            }
        };
        $('#play').button("option", options);
    }

    function disableMainTimerStopButton(shouldDisable) {
        $("#stop").button({
            disabled: shouldDisable
        })
    }

    function playerTimer_disablePersonalSplitButton(shouldDisable) {
        $(".personalSplitButton").button({
            disabled: shouldDisable
        });
    }

    function playerTimer_disablePersonalResetButton(shouldDisable) {
        $(".personalResetButton").button({
            disabled: shouldDisable
        });
    }

    function disableMainResetButton(shouldDisable) {
        $("#reset").button({
            disabled: shouldDisable
        });
    }

    nodecg.listenFor("resetTime", function () {
        var options = {
            label: "play",
            icons: {
                primary: "ui-icon-play"
            }
        };
        $("#play").button("option", options);
        resetSplitTimes();
    });

    function playerTimer_SetTime(timeHTML) {
        $timer.html(timeHTML);
    }

    function playerTimer_UpdateTimers(run) {
        var players = run.players;
        var toolbarPlayerSpecificHtml = '';
        if ( run.teams.length > 1 ) {
          $.each(run.teams, function( index, value ) {
            toolbarPlayerSpecificHtml += "" +
                '<div id="toolbar' + index + '" class="ui-widget-header ui-corner-all">' +
                '<button id="split' + index + '" class="personalSplitButton">split</button>' +
                '<button id="resetTime' + index + '" class="personalResetButton">reset</button>' +
                " " + value.name +
                '</div>';
          });
        }
        if( moreThanOneTeam ) {
            $('#playerSpecificToolbar').html(toolbarPlayerSpecificHtml);
			      $('#playerTimersHeader').show();

            $('.personalSplitButton').click(function () {
                var index = $(this).attr('id').replace('split', '');
                nodecg.sendMessage('timerSplit', index);
                splitTimer(index);
            });
            $('.personalResetButton').click(function () {
                var index = $(this).attr('id').replace('resetTime', '');
                nodecg.sendMessage('timerReset', index);
                unSplitTimer(index);
            });

            var shouldBeDisabled = true;
            if (typeof stopWatchReplicant.value != 'undefined' &&
                stopWatchReplicant.value != '' &&
                stopWatchReplicant.value.state == "running") {
                shouldBeDisabled = false;
            }

            $(".personalSplitButton").button({
                text: false,
                disabled: shouldBeDisabled,
                icons: {
                    primary: "ui-icon-check"
                }
            });
            $(".personalResetButton").button({
                text: false,
                disabled: shouldBeDisabled,
                icons: {
                    primary: "ui-icon-close"
                }
            });
        }
        else {
            $('#playerSpecificToolbar').html(toolbarPlayerSpecificHtml);
			      $('#playerTimersHeader').hide();
        }
        splitsBeforeStoppingMainTimer = run.teams.length;
    }

    function OnPlay() {
        var options = {};
        if ($('#play').text().trim() === "play") {
            $("#reset").button({
                disabled: true
            });

            nodecg.sendMessage("startTime");
            if (activeRunStartTime.value === 0) {
                nodecg.sendMessage("runStarted");
            }
            options = {
                label: "pause",
                icons: {
                    primary: "ui-icon-pause"
                }
            };
        } else {
            nodecg.sendMessage("pauseTime");
            options = {
                label: "play",
                icons: {
                    primary: "ui-icon-play"
                }
            };
        }
        $('#play').button("option", options);
    }

    function OnReset() {
        nodecg.sendMessage("resetTime");
        resetSplitTimes();
        if ($('#play').text().trim() === "pause") {
            var options = {
                label: "play",
                icons: {
                    primary: "ui-icon-play"
                }
            };
            $('#play').button("option", options);
        }
    }

    function OnStop() {
        nodecg.sendMessage("finishTime");
        nodecg.sendMessage("runEnded", 0);
        if ($('#play').text().trim() === "pause") {
            var options = {
                label: "play",
                icons: {
                    primary: "ui-icon-play"
                }
            };
            $('#play').button("option", options);
        }
    }
	
	function OnEdit() {
		var time = prompt("Please enter new time in either HH:MM:SS or MM:SS format.", "00:00:00");
		if (time.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) nodecg.sendMessage("setTime", time);
		else alert("The new time is in the wrong format.");
	}

    function playerTimer_InitializeElements() {

        $("#play").button({
            text: false,
            icons: {
                primary: "ui-icon-play"
            }
        }).click(OnPlay);

        $("#reset").button({
            text: false,
            icons: {
                primary: "ui-icon-seek-prev"
            }
        }).click(OnReset);

        $("#stop").button({
            text: false,
            icons: {
                primary: "ui-icon-check"
            },
            disabled: true
        }).click(OnStop);
		
        $("#edit").button({
            text: false,
            icons: {
                primary: "ui-icon-pencil"
            }
        }).click(OnEdit);
    }

    function Initialize_EventListeners(nodecg) {
        //console.log(nodecg)
        nodecg.listenFor("start_run", "nodecg-speedcontrol", function() {
            OnPlay();
        })

        nodecg.listenFor("reset_run", "nodecg-speedcontrol", function() {
            OnReset();
        })

        nodecg.listenFor("reset_stop", "nodecg-speedcontrol", function() {
            OnStop();
        })

        nodecg.listenFor("split_timer", "nodecg-speedcontrol", function(id) {
            console.log("SPLIT-EVENT");
            console.log(id);
            if (moreThanOneTeam) {
                nodecg.sendMessage('timerSplit', id);
            }
            nodecg.sendMessage('timerSplit', id);
            splitTimer(id);
        })
    }

    playerTimer_InitializeElements();
    Initialize_EventListeners(nodecg);
})
