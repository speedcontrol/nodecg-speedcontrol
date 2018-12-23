'use strict';
$(function () {
    var $timer = $("#theTimer");
    var splitsBeforeStoppingMainTimer = 255;
    var stoppedTimers = 0;
    var moreThanOneTeam = false;
    var splitTimes = [];
    var lastTimerState = "";
// Replicant initialization

    var stopWatchReplicant = nodecg.Replicant('timer');
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
					toggleEditButton(false);
                }
                break;
            case 'finished':
                if(lastTimerState != newVal.state) {
                    $timer.css('color', 'green');
                    disableMainTimerStopButton(true);
                    disableMainResetButton(false);
                    playerTimer_disablePersonalSplitButton(true);
                    playerTimer_disablePersonalResetButton(true);
					toggleEditButton(true);
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
					toggleEditButton(true);
                }
                break;
            case 'stopped':
                if(lastTimerState != newVal.state) {
                    disableMainTimerStopButton(true);
                    disableMainResetButton(true);
                    playerTimer_disablePersonalResetButton(false);
                    playerTimer_disablePersonalSplitButton(true);
                    $timer.css('color', 'gray');
					toggleEditButton(false);
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
            playerTimer_UpdateTimers(newValue);
        }
    });

    var finishedTimersReplicant = nodecg.Replicant('finishedTimers');
    finishedTimersReplicant.on('change', function(newValue, oldValue) {
        if(typeof newValue != 'undefined' && newValue != '') {
            if(splitTimes.length != newValue.length) {
                splitTimes = newValue;
                updateSplitTimerTextColor(newValue);
            }
        }
    });

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
        splitTime.id = runDataActiveRunReplicant.value.teams[index].id;
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
	
	function toggleEditButton(option) {
		$("#edit").button({
			disabled: option
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
        var toolbarPlayerSpecificHtml = '';
        if ( run.teams.length > 1 ) {
          $.each(run.teams, function( index, team ) {
			if (team.name) var teamName = team.name;
			else if (team.players.length > 1) var teamName = `Team ${index+1}`
			else var teamName = team.players[0].name;

            toolbarPlayerSpecificHtml += "" +
                '<div id="toolbar' + index + '" class="ui-widget-header ui-corner-all">' +
                '<button id="split' + index + '" class="personalSplitButton">split</button>' +
                '<button id="resetTime' + index + '" class="personalResetButton">reset</button>' +
                " " + teamName +
                '</div>';
          });
        }
        if( moreThanOneTeam ) {
            $('#playerSpecificToolbar').html(toolbarPlayerSpecificHtml);
			      $('#playerTimersHeader').show();

            $('.personalSplitButton').click(function () {
				var index = $(this).attr('id').replace('split', '');
				var id = runDataActiveRunReplicant.value.teams[index].id;
                nodecg.sendMessage('teamFinishTime', id);
                splitTimer(index);
            });
            $('.personalResetButton').click(function () {
				var index = $(this).attr('id').replace('resetTime', '');
				var id = runDataActiveRunReplicant.value.teams[index].id;
                nodecg.sendMessage('teamFinishTimeUndo', id);
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
		var currentTime = stopWatchReplicant.value.time || '00:00:00'
		var time = prompt("Please enter new time in either HH:MM:SS or MM:SS format.", currentTime);
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

        nodecg.listenFor("split_timer", "nodecg-speedcontrol", function(index) {
            console.log("SPLIT-EVENT");
			console.log(index);
			var id = runDataActiveRunReplicant.value.teams[index].id;
            if (moreThanOneTeam) {
                nodecg.sendMessage('teamFinishTime', id);
            }
            nodecg.sendMessage('teamFinishTime', id);
            splitTimer(index);
        })
    }

    playerTimer_InitializeElements();
    Initialize_EventListeners(nodecg);
})
