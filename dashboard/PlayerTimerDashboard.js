'use strict';
$(function () {
    var $timer = $("#theTimer");
    var splitsBeforeStoppingMainTimer = 255;
    var stoppedTimers = 0;
    var moreThanOnePlayer = false;
    var splitTimes = [];
    var lastTimerState = "";
// Replicant initialization

    var stopWatchesReplicant = nodecg.Replicant('stopwatches');
    stopWatchesReplicant.on('change', function (oldVal, newVal) {
        if (!newVal) return;
        var time = newVal[0].time || '88:88:88';
        switch (newVal[0].state) {
            case 'paused':
                if(lastTimerState != newVal[0].state) {
                    $timer.css('color', '#555500');
                    disableMainTimerStopButton(true);
                    playerTimer_disablePersonalSplitButton(true);
                    playerTimer_disablePersonalResetButton(false);
                    disableMainResetButton(true);
                }
                break;
            case 'finished':
                if(lastTimerState != newVal[0].state) {
                    $timer.css('color', 'green');
                    disableMainTimerStopButton(true);
                    disableMainResetButton(false);
                    playerTimer_disablePersonalSplitButton(true);
                    playerTimer_disablePersonalResetButton(true);
					nodecg.sendMessage("forceRefreshIntermission");
                }
                break;
            case 'running':
                if(lastTimerState != newVal[0].state) {
                    $timer.css('color', '#008BB9');
                    if (moreThanOnePlayer) {
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
                if(lastTimerState != newVal[0].state) {
                    disableMainTimerStopButton(true);
                    disableMainResetButton(true);
                    playerTimer_disablePersonalResetButton(false);
                    playerTimer_disablePersonalSplitButton(true);
                    $timer.css('color', 'gray');
                }
                break;
            default:
        }
        lastTimerState = newVal[0].state;
        playerTimer_SetTime(time);
    });

    var runDataActiveRunRunnerListReplicant = nodecg.Replicant("runDataActiveRunRunnerList");
    runDataActiveRunRunnerListReplicant.on("change", function (oldValue, newValue) {
        if (typeof newValue !== 'undefined' && newValue != '') {
            playerTimer_UpdateTimers(newValue);
            if(newValue.length > 1) {
                moreThanOnePlayer = true;
            }
            else {
                moreThanOnePlayer = false;
            }
        }
    });

    var finishedTimersReplicant = nodecg.Replicant('finishedTimers');
    finishedTimersReplicant.on('change', function(oldValue, newValue) {
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
                value.time = stopWatchesReplicant.value[0].time;
            }
        });
        if(!found) {
            var newSplit = createSplitTime(splitIndex);
            splitTimes.push(newSplit);
        }
        stoppedTimers = splitTimes.length;

        if (stoppedTimers >= splitsBeforeStoppingMainTimer) {
            nodecg.sendMessage("finishTime", 0);
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
        splitTime.time = stopWatchesReplicant.value[0].time;
        splitTime.name = runDataActiveRunRunnerListReplicant.value[index].names.international;
        return splitTime;
    }

    function setPlayButtonToPauseButton() {
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

    function playerTimer_UpdateTimers(players) {
        var toolbarPlayerSpecificHtml = '';
        if (players.length > 1) {
            $.each(players, function (index, value) {
                toolbarPlayerSpecificHtml += "" +
                    '<div id="toolbar' + index + '" class="ui-widget-header ui-corner-all">' +
                    '<button id="split' + index + '" class="personalSplitButton">split</button>' +
                    '<button id="resetTime' + index + '" class="personalResetButton">reset</button>' +
                    " " + value.names.international +
                    '</div>';
            });
            $('#playerSpecificToolbar').html(toolbarPlayerSpecificHtml);

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
            if (typeof stopWatchesReplicant.value != 'undefined' &&
                stopWatchesReplicant.value != '' &&
                stopWatchesReplicant.value[0].state == "running") {
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
        }
        splitsBeforeStoppingMainTimer = players.length;
    }

    function OnPlay() {
        var options = {};
        if ($('#play').text() === "play") {
            $("#reset").button({
                disabled: true
            });

            nodecg.sendMessage("startTime", 0);
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
            nodecg.sendMessage("pauseTime", 0);
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
        nodecg.sendMessage("resetTime", 0);
        resetSplitTimes();
        if ($('#play').text() === "pause") {
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
        nodecg.sendMessage("finishTime", 0);
        nodecg.sendMessage("runEnded", 0);
        if ($('#play').text() === "pause") {
            var options = {
                label: "play",
                icons: {
                    primary: "ui-icon-play"
                }
            };
            $('#play').button("option", options);
        }
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
    }

    function Initialize_EventListeners(nodecg) {
        console.log(nodecg)
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
            splitTimer(id);
        })
    }

    playerTimer_InitializeElements();
    Initialize_EventListeners(nodecg);
})
