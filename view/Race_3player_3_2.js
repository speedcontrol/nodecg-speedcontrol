'use strict';
$(function () {
    // JQuery selector initialiation ###
    var $timerInfo = $('#timer');
    var $runnerInfoTagPlayer1Name = $('#runner1InformationName');
    var $runnerInfoTagPlayer2Name = $('#runner2InformationName');
    var $runnerInfoTagPlayer3Name = $('#runner3InformationName');
    var $runInformationSystem = $('#runInformationGameSystem');
    var $runInformationCategory = $('#runInformationGameCategory');
    var $runInformationEstimate = $('#runInformationGameEstimate');
    var $runInformationName = $('#runInformationGameName');
    var $twitchLogo = $('#twitchLogo1');
    var $twitchLogo2 = $('#twitchLogo2');
    var $twitchLogo3 = $('#twitchLogo3');

    var currentTime = '';
    var displayTwitchforMilliseconds = 15000;
    var intervalToNextTwitchDisplay = 120000;

    // sceneID must be uniqe for this view, it's used in positioning of elements when using edit mode
    // if there are two views with the same sceneID all the elements will not have the correct positions
    var sceneID = "Race_2player_4_3";

    // Temporary container used for edit mode to store all element position data. See createPositioningConfig()
    var itemPositioningConfigurationContainer = [];

    var isEditModeEnabled = false;

    // NodeCG Message subscription ###
    nodecg.listenFor("resetTime", resetAllPlayerTimers);
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
                $timerInfo.css('color','#22D640');
                break;
            case 'running':
                $timerInfo.css('color','rgb(255,255,255,0.7)');
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
        if(typeof newValue !== 'undefined' && newValue.players.length == 3) {
            updateSceneFields(newValue);
        }
    });

    var runDataActiveRunRunnerListReplicant = nodecg.Replicant("runDataActiveRunRunnerList");
    runDataActiveRunRunnerListReplicant.on("change", function (oldValue, newValue) {
        if(typeof newValue === 'undefined') {
            return;
        }

        if(newValue.length != 3) {
            return;
        }

        setGameFieldAlternate($runnerInfoTagPlayer1Name,getRunnerInformationName(newValue,0));
        setGameFieldAlternate($runnerInfoTagPlayer2Name,getRunnerInformationName(newValue,1));
        setGameFieldAlternate($runnerInfoTagPlayer3Name,getRunnerInformationName(newValue,2));
        setTimeout(displayTwitchInstead, 15000);
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
        var runInfoGameName = runData.game;
        var runInfoGameEstimate = "EST: 00:"+runData.estimate;
        var runInfoGameSystem = runData.system;
        var runInfoGameCategory = runData.category;

        setGameField($runInformationSystem,runInfoGameSystem);
        setGameField($runInformationCategory,runInfoGameCategory);
        setGameField($runInformationEstimate,runInfoGameEstimate);
        setGameField($runInformationName,runInfoGameName);
    }

    function setTime(timeHTML) {
        $timerInfo.html(timeHTML);
        currentTime = timeHTML;
    }

    function getRunnerInformationName(runnerDataArray, index) {
        if(typeof runnerDataArray[index] === 'undefined') {
            console.log("Player nonexistant!");
            return "";
        }
        return runnerDataArray[index].names.international;
    }

    function getRunnerInformationTwitch(runnerDataArray, index) {
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
        return twitchUrl;
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

        } else {
            console.log("Well we found multiple entries,should NEVER happen!");
        }

    }

    // Timer functions ###

    function resetTimer(index) {
        var realIndex = Number(index) + Number(1);
        $('#runner'+realIndex+'TimerFinished').html("");
        hideTimerFinished(realIndex);
    }

    function resetAllPlayerTimers() {
        $('#runner1TimerFinished').html("");
        $('#runner2TimerFinished').html("");
        $('#runner3TimerFinished').html("");
        hideTimerFinished(1);
        hideTimerFinished(2);
        hideTimerFinished(3);
    }

    function splitTimer(index) {
        var realIndex = Number(index) + Number(1);
        $('#runner'+realIndex+'TimerFinished').html(currentTime);
        showTimerFinished(realIndex);
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

    // Transition to change html from current to nextHtml
    function setGameFieldAlternate($selector, nextHtml) {
        var tm = new TimelineMax({paused: true});
        tm.to($selector, 0.5, {opacity: '0', transform: "scale(0)",  ease: Quad.easeOut },'0');
        tm.to($selector, 0.5, {opacity: '1', transform: "scale(1)", onStart:updateSelectorText, onStartParams:[$selector, nextHtml] ,ease: Quad.easeOut },'0.5');
        tm.play();
    }

    // Transition to change html from current to nextHtml
    function setGameField($selector, nextHtml) {
        var tm = new TimelineMax({paused: true});
        tm.to($selector, 0.5, {opacity: '0', transform: "translateX(-50px)",  ease: Quad.easeOut },'0');
        tm.to($selector, 0.5, {opacity: '1', transform: "translateX(0px)", onStart:updateSelectorText, onStartParams:[$selector, nextHtml] ,ease: Quad.easeOut },'0.5');
        tm.play();
    }

    // Function just sets the text of the DOM element
    function updateSelectorText($textDivToUpdate, newHtml) {
        $textDivToUpdate.html(newHtml);
    }

    function displayTwitchInstead() {
        setGameFieldAlternate($runnerInfoTagPlayer1Name,getRunnerInformationTwitch(runDataActiveRunRunnerListReplicant.value,0));
        setGameFieldAlternate($runnerInfoTagPlayer2Name,getRunnerInformationTwitch(runDataActiveRunRunnerListReplicant.value,1));
        setGameFieldAlternate($runnerInfoTagPlayer3Name,getRunnerInformationTwitch(runDataActiveRunRunnerListReplicant.value,2));
        $twitchLogo.show();
        $twitchLogo2.show();

        var tm = new TimelineMax({paused: true});
        tm.to($twitchLogo, 0.5, {opacity: '1', transform: "scale(0.9)",  ease: Quad.easeOut },'0');
        tm.to($twitchLogo2, 0.5, {opacity: '1', transform: "scale(0.9)",  ease: Quad.easeOut },'0');
        tm.to($twitchLogo3, 0.5, {opacity: '1', transform: "scale(0.9)",  ease: Quad.easeOut },'0');
        tm.play();
        setTimeout(hideTwitch,displayTwitchforMilliseconds);
    }

    function hideTwitch() {
        setGameFieldAlternate($runnerInfoTagPlayer1Name,getRunnerInformationName(runDataActiveRunRunnerListReplicant.value,0));
        setGameFieldAlternate($runnerInfoTagPlayer2Name,getRunnerInformationName(runDataActiveRunRunnerListReplicant.value,1));
        setGameFieldAlternate($runnerInfoTagPlayer3Name,getRunnerInformationName(runDataActiveRunRunnerListReplicant.value,2));
        var tm = new TimelineMax({paused: true});
        tm.to($twitchLogo, 0.5, {opacity: '0', transform: "scale(0)",  ease: Quad.easeOut },'0');
        tm.to($twitchLogo2, 0.5, {opacity: '0', transform: "scale(0)",  ease: Quad.easeOut },'0');
        tm.to($twitchLogo3, 0.5, {opacity: '0', transform: "scale(0)",  ease: Quad.easeOut },'0');
        tm.play();
        setTimeout(displayTwitchInstead,intervalToNextTwitchDisplay);
    }

    function hideTimerFinished(index) {
        $('#runner'+index+'TimerFinishedContainer').css("opacity","0");
    }

    function showTimerFinished(index) {
        var tm = new TimelineMax({paused: true});
        tm.to($('#runner'+index+'TimerFinishedContainer'), 0.5, {opacity: '1',  ease: Quad.easeOut },'0');
        tm.play();
    }

    hideTimerFinished(1);
    hideTimerFinished(2);
    hideTimerFinished(3);

    $twitchLogo3.css('transform', 'scale(0)');
    $twitchLogo2.css('transform', 'scale(0)');
    $twitchLogo.css('transform', 'scale(0)');
});



