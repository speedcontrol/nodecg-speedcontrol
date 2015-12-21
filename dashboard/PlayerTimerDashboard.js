'use strict';

var $timer = $("#theTimer");
var splitsBeforeStoppingMainTimer = 255;
var stoppedTimers = 0;

var runDataActiveRunRunnerListReplicant = nodecg.Replicant("runDataActiveRunRunnerList");
runDataActiveRunRunnerListReplicant.on("change", function (oldValue, newValue) {
    if( typeof newValue !== 'undefined') {
        updateTimers(newValue);
    }
});

var stopWatchesReplicant = nodecg.Replicant('stopwatches');
stopWatchesReplicant.on('change', function(oldVal, newVal) {
    if (!newVal) return;
    var time  = newVal[0].time || '88:88:88';
    switch (newVal[0].state) {
        case 'paused':
            $timer.css('color','#555500');
            break;
        case 'finished':
            $timer.css('color','green');
            break;
        case 'running':
            $timer.css('color','#008BB9');
            break;
        case 'stopped':
            $timer.css('color','gray');
            break;
        default:
    }
    setTime(time);
});

function setTime(timeHTML) {
    $timer.html(timeHTML);
}

function updateTimers(players) {
    var toolbarPlayerSpecificHtml = '';
    if(players.length > 1) {
        $.each(players, function (index, value) {
            toolbarPlayerSpecificHtml += "" +
                '<div id="toolbar' + index + '" class="ui-widget-header ui-corner-all">' +
                '<button id="split' + index + '" class="personalSplitButton">split</button>' +
                '<button id="resetTime' + index + '" class="personalResetButton">reset</button>' +
               " " +  value.names.international +
                '</div>';
        });
        $('#playerSpecificToolbar').html(toolbarPlayerSpecificHtml);

        $('.personalSplitButton').click(function () {
            var index = $(this).attr('id').replace('split', '');
            stoppedTimers++;
            if(stoppedTimers >= splitsBeforeStoppingMainTimer) {
                nodecg.sendMessage("finishTime", 0);
            }
            nodecg.sendMessage('timerSplit', index);
        });
        $('.personalResetButton').click(function () {
            var index = $(this).attr('id').replace('resetTime', '');
            stoppedTimers--;
            nodecg.sendMessage('timerReset', index);
        });

        $(".personalSplitButton").button({
            text: false,
            icons: {
                primary: "ui-icon-check"
            }
        });
        $(".personalResetButton").button({
            text: false,
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

$( "#play" ).button({
    text: false,
    icons: {
        primary: "ui-icon-play"
    }
})
    .click(function() {
        if ( $( this ).text() === "play" ) {
            nodecg.sendMessage("startTime", 0);
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
        $( this ).button( "option", options );
    });
$( "#reset" ).button({
    text: false,
    icons: {
        primary: "ui-icon-seek-prev"
    }
})
    .click(function() {
        nodecg.sendMessage("resetTime", 0);
        stoppedTimers = 0;
        if($('#play').text() === "pause") {
            var options = {
                label: "play",
                icons: {
                    primary: "ui-icon-play"
                }
            };
            $('#play').button("option", options);
        }
    });

$( "#stop" ).button({
    text: false,
    icons: {
        primary: "ui-icon-check"
    }
})
    .click(function() {
        nodecg.sendMessage("finishTime", 0);
        if($('#play').text() === "pause") {
            var options = {
                label: "play",
                icons: {
                    primary: "ui-icon-play"
                }
            };
            $('#play').button( "option", options );
        }
    });
