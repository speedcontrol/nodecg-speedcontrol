'use strict';
$(function () {
    // JQuery selector initialiation ###
    var $timerInfo = $('#timer');
    var $runnerInfoElements = $('div.runnerInfo');
    var $runnerTimerFinishedElements = $('.runnerTimerFinished')
    var $runnerTimerFinishedContainers = $('.runnerTimerFinishedContainer')
    var $runInformationSystem = $('#runInformationGameSystem');
    var $runInformationCategory = $('#runInformationGameCategory');
    var $runInformationEstimate = $('#runInformationGameEstimate');
    var $runInformationName = $('#runInformationGameName');
    var $twitchLogos = $('.twitchLogo');
    var $gameCaptures = $('.gameCapture');

    var currentTime = '';
    var displayTwitchforMilliseconds = 15000;
    var intervalToNextTwitchDisplay = 120000;
    var timeout = null;

    // sceneID must be uniqe for this view, it's used in positioning of elements when using edit mode
    // if there are two views with the same sceneID all the elements will not have the correct positions
    var sceneID = $('html').attr('data-sceneid');

    $gameCaptures.each(function () {
        var aspectRatio = $(this).attr('aspect-ratio');
        switch(aspectRatio) {
            case '4:3':
                $(this).css('width','400px');
                $(this).css('height','300px');
                break;
            case '16:9':
                $(this).css('width','720px');
                $(this).css('height','405px');
                break;
            case '3:2':
                $(this).css('width','240px');
                $(this).css('height','160px');
                break;
        }
    });

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
    sceneLayoutConfigurationReplicant.on('change', function(oldValue, newValue) {
        if(typeof newValue !== 'undefined' && newValue != '') {
            applyBackgroundTransparence(newValue.backgroundTransparency);
            handleEditMode(newValue.editMode)
        }
    });

    var scenePositioningConfigurationReplicant = nodecg.Replicant("scenePositioningConfiguration");
    scenePositioningConfigurationReplicant.on("change", function (oldValue, newValue) {
        if(typeof newValue !== 'undefined' && newValue != '') {
            updateItemPositions(newValue);
        }
    });

    var stopWatchesReplicant = nodecg.Replicant('stopwatches');
    stopWatchesReplicant.on('change', function(oldVal, newVal) {
        if (!newVal) return;
        var time  = newVal[0].time || '88:88:88';
        if( oldVal )
        {
          $timerInfo.toggleClass('timer_'+oldVal[0].state,false);
        }
        $timerInfo.toggleClass('timer_'+newVal[0].state,true);
        setTime(time);
    });

    var runDataActiveRunReplicant = nodecg.Replicant("runDataActiveRun");
    runDataActiveRunReplicant.on("change", function (oldValue, newValue) {
        if(typeof newValue !== 'undefined' && newValue != '' ) {
            updateSceneFields(newValue);
        }
    });

    var runDataActiveRunRunnerListReplicant = nodecg.Replicant("runDataActiveRunRunnerList");
    runDataActiveRunRunnerListReplicant.on("change", function (oldValue, newValue) {
        if(typeof newValue === 'undefined' || newValue == '') {
            return;
        }


        $runnerInfoElements.each( function( index, element ) {
            setGameFieldAlternate($(this),getRunnerInformationName(newValue,index));
        });

        if(timeout != null) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(displayTwitchInstead, 2000);
    });

    // Replicant functions ###

    function updateItemPositions(positioningArray) {
        itemPositioningConfigurationContainer = JSON.parse(JSON.stringify(positioningArray))
        $.each(positioningArray,function(index, positioningItem) {
            if(positioningItem.scene == sceneID) {
                $('#' + positioningItem.id).css('top', positioningItem.y);
                $('#' + positioningItem.id).css('left', positioningItem.x);
                $('#' + positioningItem.id).css('width', positioningItem.width);
                $('#' + positioningItem.id).css('height', positioningItem.height);
            }
        });
    }

    function updateSceneFields(runData) {
        var runInfoGameName = runData.game;
        var runInfoGameEstimate = runData.estimate;
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
        $('#positionDebug').html("X: "+ui.position.left + " Y: " + ui.position.top + " Item ID: "+ui.helper[0].id);
    }

    function createPositioningConfig(xPos, yPos, ItemId, scene) {
        var positionConfig = {};
        positionConfig.x = xPos;
        positionConfig.y = yPos;
        positionConfig.id = ItemId;
        positionConfig.scene = scene;
        positionConfig.width = $('#'+ItemId).width();
        positionConfig.height = $('#'+ItemId).height();
        return positionConfig;
    }

    function saveConfiguration() {
        scenePositioningConfigurationReplicant.value = itemPositioningConfigurationContainer;
    }

    function revertChanges() {
        scenePositioningConfigurationReplicant.value = undefined;
    }

    function convertToTrueAspectRatio(aspectRatioString) {
        var numbers = aspectRatioString.split(':');
        var realNumber = Number(numbers[0])/Number(numbers[1]);
        return realNumber;
    }

    function handleEditMode(isEnabled) {
        if(isEnabled) {
            $('.dummyTextable').html("######");

            $runnerTimerFinishedElements.each( function( index, e ){
                showTimerFinished(index);
            });

            isEditModeEnabled = true;
            $('.positionable').addClass("editableObject");
            $('.positionable').draggable({
                containment: "parent",
                grid: [ 5, 5 ],
                opacity: 0.35,
                drag: itemDragged,
                start: function( event, ui ) {
                    addPositioningInformation();
                    $('#'+ui.helper[0].id).css('z-index','100');
                    if($('#'+ui.helper[0].id).hasClass('gameCapture')) {

                    }
                },
                stop: function( event, ui ) {
                    if($('#'+ui.helper[0].id).hasClass('gameCapture')) {
                        $('.gameCapture').each(function() {
                            var positionConfig = createPositioningConfig($(this).offset().left, $(this).offset().top, $(this).attr('id'), sceneID);
                            addToPositionConfig(positionConfig);
                        });
                    }
                    else {
                        var positionConfig = createPositioningConfig(ui.position.left, ui.position.top, ui.helper[0].id, sceneID);
                        removePositioningInformation();
                        addToPositionConfig(positionConfig);
                    }
                    $('#'+ui.helper[0].id).css('z-index','0');
                }
            });

            var aspectRatio = $('.gameCapture').attr('aspect-ratio');
            var trueAspectRatio = convertToTrueAspectRatio(aspectRatio);

            $('.gameCapture').first().resizable({
                aspectRatio: trueAspectRatio,
                alsoResize: ".gameCapture",
                stop: function( event, ui ) {
                    $('.gameCapture').each(function() {
                        var positionConfig = createPositioningConfig($(this).offset().left, $(this).offset().top, $(this).attr('id'), sceneID);
                        addToPositionConfig(positionConfig);
                    });
                }
            });
        }
        else {
            if(isEditModeEnabled) {
                $('.positionable').removeClass("editableObject");
                $('.positionable').draggable("destroy");
                $('.gameCapture').first().resizable("destroy");
                isEditModeEnabled = false;
                $('.dummyTextable').html("");
                $runnerTimerFinishedElements.each( function( index, e ){
                    hideTimerFinished(index);
                });
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
            entryFound[0].width = configData.width;
            entryFound[0].height = configData.height;

        } else {
            console.log("Well we found multiple entries,should NEVER happen!");
        }

    }

    // Timer functions ###

    function resetTimer(index) {
        $runnerTimerFinishedElements.eq(index).html("");
        hideTimerFinished(index);
    }

    function resetAllPlayerTimers() {
        $runnerTimerFinishedElements.each( function( index, element) {
          $(this).html("");
          hideTimerFinished(index);
        });
    }

    function splitTimer(index) {
        $runnerTimerFinishedElements.eq(index).html(currentTime);
        showTimerFinished(index);
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
        var indexesToNotUpdate = [];
        $runnerInfoElements.each(function(index,element) {
            if(getRunnerInformationTwitch(runDataActiveRunRunnerListReplicant.value,index) == '---') {
                indexesToNotUpdate.push(index);
            }
            else {
                setGameFieldAlternate($(this), getRunnerInformationTwitch(runDataActiveRunRunnerListReplicant.value, index));
            }
        });

        var tm = new TimelineMax({paused: true});
        $twitchLogos.each( function(index, element) {
            if($.inArray(index, indexesToNotUpdate) == -1) {
                $(this).show();
                tm.to($(this), 0.5, {opacity: '1', transform: "scale(0.9)", ease: Quad.easeOut}, '0');
            }
        });

        tm.play();
        timeout = setTimeout(hideTwitch,displayTwitchforMilliseconds);
    }

    function hideTwitch() {
        var indexesToNotUpdate = [];
        $runnerInfoElements.each( function(index,element) {
            if(getRunnerInformationTwitch(runDataActiveRunRunnerListReplicant.value,index) == '---') {
                indexesToNotUpdate.push(index);
            }
            else {
                setGameFieldAlternate($(this), getRunnerInformationName(runDataActiveRunRunnerListReplicant.value, index));
            }
        });
        var tm = new TimelineMax({paused: true});
        $twitchLogos.each( function(index, element) {
            if($.inArray(index, indexesToNotUpdate) == -1) {
                $(this).show();
                tm.to($(this), 0.5, {opacity: '0', transform: "scale(0)", ease: Quad.easeOut}, '0');
            }
        });
        tm.play();
        timeout = setTimeout(displayTwitchInstead,intervalToNextTwitchDisplay);
    }

    function hideTimerFinished(index) {
        $runnerTimerFinishedContainers.eq(index).css("opacity","0");
    }

    function showTimerFinished(index) {
        var tm = new TimelineMax({paused: true});
        tm.to($runnerTimerFinishedContainers.eq(index), 0.5, {opacity: '1',  ease: Quad.easeOut },'0');
        tm.play();
    }

    $runnerTimerFinishedElements.each( function( index, e ){
        hideTimerFinished(index);
    });

    $twitchLogos.each( function(index, element) {
        $(this).css('transform', 'scale(0)');
    });
});
