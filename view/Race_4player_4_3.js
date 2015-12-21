'use strict';
$(function () {
    // JQuery selector initialiation ###
    var $timerInfo = $('#timer');
    var $runInfoTag = $('#runInformation');
    var $runnerInfoTagPlayer1 = $('#runner1Information');
    var $runnerInfoTagPlayer2 = $('#runner2Information');
    var $runnerInfoTagPlayer3 = $('#runner3Information');
    var $runnerInfoTagPlayer4 = $('#runner4Information');

    var currentTime = '';

    // sceneID must be uniqe for this view, it's used in positioning of elements when using edit mode
    // if there are two views with the same sceneID all the elements will not have the correct positions
    var sceneID = "4PlayerRace4_3";

    // Temporary container used for edit mode to store all element position data. See createPositioningConfig()
    var itemPositioningConfigurationContainer = [];

    var isEditModeEnabled = false;

    // NodeCG Message subscription ###
    nodecg.listenFor('timerReset', resetTimer);
    nodecg.listenFor('timerSplit', splitTimer);
    nodecg.listenFor('savePositionConfiguration', saveConfiguration);
    nodecg.listenFor('revertToDefault', revertChanges);

    // Replicants ###

    var sceneLayoutConfigurationReplicant = nodecg.Replicant('sceneLayoutConfiguration');
    sceneLayoutConfigurationReplicant.on('change', function(oldVal, newVal) {
        if(typeof newVal !== 'undefined') {
            applyBackgroundTransparence(newVal.backgroundTransparency);
            handleEditMode(newVal.editMode)
        }
    });

    var scenePositioningConfigurationReplicant = nodecg.Replicant("scenePositioningConfiguration");
    scenePositioningConfigurationReplicant.on("change", function (oldValue, newValue) {
        if(typeof newValue !== 'undefined') {
            updateItemPositions(newValue);
        }
    });

    var stopWatchesReplicant = nodecg.Replicant('stopwatches');
    stopWatchesReplicant.on('change', function(oldVal, newVal) {
        if (!newVal) return;
        var time  = newVal[0].time || '88:88:88';
        switch (newVal[0].state) {
            case 'paused':
                $timerInfo.css('color','yellow');
                break;
            case 'finished':
                $timerInfo.css('color','green');
                break;
            case 'running':
                $timerInfo.css('color','white');
                break;
            case 'stopped':
                $timerInfo.css('color','gray');
                break;
            default:
        }
        setTime(time);
    });

    var runDataActiveRunReplicant = nodecg.Replicant("runDataActiveRun");
    runDataActiveRunReplicant.on("change", function (oldValue, newValue) {
        if(typeof newValue !== 'undefined') {
            updateSceneFields(newValue);
        }
    });

    var runDataActiveRunRunnerListReplicant = nodecg.Replicant("runDataActiveRunRunnerList");
    runDataActiveRunRunnerListReplicant.on("change", function (oldValue, newValue) {
        if(typeof newValue === 'undefined') {
            return;
        }
            if(newValue.length != 4) {
            return;
        }

        var runnerInfoHTMLDataPlayer1 = getRunnerInformationTable(newValue,0);
        var runnerInfoHTMLDataPlayer2 = getRunnerInformationTable(newValue,1);
        var runnerInfoHTMLDataPlayer3 = getRunnerInformationTable(newValue,2);
        var runnerInfoHTMLDataPlayer4 = getRunnerInformationTable(newValue,3);

        $runnerInfoTagPlayer1.html(runnerInfoHTMLDataPlayer1);
        $runnerInfoTagPlayer2.html(runnerInfoHTMLDataPlayer2);
        $runnerInfoTagPlayer3.html(runnerInfoHTMLDataPlayer3);
        $runnerInfoTagPlayer4.html(runnerInfoHTMLDataPlayer4);
    });

    // Replicant functions ###

    function updateItemPositions(positioningArray) {
        itemPositioningConfigurationContainer = positioningArray;
        $.each(positioningArray,function(index, positioningItem) {
            if(positioningItem.scene == sceneID) {
                $('#' + positioningItem.id).css('top', positioningItem.y);
                $('#' + positioningItem.id).css('left', positioningItem.x);
            }
        });
    }

    function updateSceneFields(runData) {
        var runInfoHTMLData = getRunInformationTable(runData);
        $runInfoTag.html(runInfoHTMLData);
    }

    function setTime(timeHTML) {
        $timerInfo.html(timeHTML);
        currentTime = timeHTML;
    }

    function getRunInformationTable(runData) {
        var bodyHtml = '<table class="table-information">'+
            '<tr><td class="rowTitleGame">'+ runData.game +'</td><td class="rowTitleGame">' + runData.estimate + '</td></tr>' +
            '<tr><td class="rowTitleGame">'+ runData.category +'</td><td class="rowTitleGame">' + runData.system + '</td></tr>' +
            '</table>';
        return bodyHtml;
    }

    function getRunnerInformationTable(runnerDataArray, index) {
        if(typeof runnerDataArray[index] === 'undefined') {
            console.log("Player nonexistant!");
            return "";
        }

        var twitchUrl = "";
        if (runnerDataArray[index].twitch != null &&
            runnerDataArray[index].twitch.uri != null) {
            twitchUrl = runnerDataArray[index].twitch.uri.replace("http://www.twitch.tv/","")
        }
        else {
            twitchUrl = "---";
        }
        var bodyHtml = '<table class="table-information">'+
            '<tr><td class="rowTitlePlayer">'+ runnerDataArray[index].names.international +'</td><td class="rowContentPlayer" id="twitchField">' + twitchUrl+ '</td></tr>' +
            '</table>';
        return bodyHtml;
    }

    // Edit Mode functions ###

    function addPositioningInformation() {
       $('#positionDebug').css('opacity','1');
    }

    function removePositioningInformation(){
        $('#positionDebug').css('opacity','0');
    }

    function itemDragged( event, ui ) {
        $('#positionDebug').html("X: "+ui.position.left + " Y: " + ui.position.top);
    }

    function createPositioningConfig(xPos, yPos, ItemId, scene) {
        var positionConfig = {};
        positionConfig.x = xPos;
        positionConfig.y = yPos;
        positionConfig.id = ItemId;
        positionConfig.scene = scene;
        return positionConfig;
    }

    function saveConfiguration() {
        scenePositioningConfigurationReplicant.value = itemPositioningConfigurationContainer;
    }

    function revertChanges() {
        scenePositioningConfigurationReplicant.value = undefined;
    }

    function handleEditMode(isEnabled) {
        if(isEnabled) {
            isEditModeEnabled = true;
            $('.positionable').addClass("editableObject");
            $('.positionable').draggable({
                containment: "parent",
                grid: [ 5, 5 ],
                opacity: 0.35,
                drag: itemDragged,
                start: function( event, ui ) {
                    addPositioningInformation();
                },
                stop: function( event, ui ) {
                    var positionConfig = createPositioningConfig(ui.position.left, ui.position.top, ui.helper[0].id, sceneID);
                    removePositioningInformation();
                    addToPositionConfig(positionConfig);
                }
            });
                $('.dummyTextable').html("######");
        }
        else {
            if(isEditModeEnabled) {
                $('.positionable').removeClass("editableObject");
                $('.positionable').draggable("destroy");
                isEditModeEnabled = false;
                $('.dummyTextable').html("");
            }
        }
    }

    function addToPositionConfig(configData) {
        var entryFound = $.grep(itemPositioningConfigurationContainer, function(e){ return (e.id == configData.id && e.scene == configData.scene); });
        if (entryFound.length == 0) {
            itemPositioningConfigurationContainer.push(configData);
        } else if (entryFound.length == 1) {
            entryFound[0].x = configData.x;
            entryFound[0].y = configData.y;
            console.log(entryFound);

        } else {
            console.log("Well we found multiple entries,should NEVER happen!");
        }

    }

    // Timer functions ###

    function resetTimer(index) {
        var realIndex = Number(index) + Number(1);
        $('#runner'+realIndex+'TimerFinished').html("");
    }
    function splitTimer(index) {
        var realIndex = Number(index) + Number(1);
        $('#runner'+realIndex+'TimerFinished').html(currentTime);
    }

    // General functions ###

    function applyBackgroundTransparence(applyTransparency) {
        if (applyTransparency) {
            $('#window-container').css('opacity',0.5);
        }
        else{
            $('#window-container').css('opacity',1.0);
        }
    }
});
