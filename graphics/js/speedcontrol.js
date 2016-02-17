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
    var $generateCSSContentButton = $('#generateCSSContentButton');
    var $resetCSSContentButton = $('#resetCSSContentButton');

    var currentTime = '';
    var displayTwitchforMilliseconds = 15000;
    var intervalToNextTwitchDisplay = 120000;
    var timeout = null;

    // sceneID must be uniqe for this view, it's used in positioning of elements when using edit mode
    // if there are two views with the same sceneID all the elements will not have the correct positions
    var sceneID = $('html').attr('data-sceneid');

    var isEditModeEnabled = false;

    // NodeCG Message subscription ###
    nodecg.listenFor("resetTime", resetAllPlayerTimers);
    nodecg.listenFor('timerReset', resetTimer);
    nodecg.listenFor('timerSplit', splitTimer);
    nodecg.listenFor('revertToDefault', revertChanges);

    // Replicants ###
    var sceneLayoutConfigurationReplicant = nodecg.Replicant('sceneLayoutConfiguration');
    sceneLayoutConfigurationReplicant.on('change', function(oldValue, newValue) {
        if(typeof newValue !== 'undefined' && newValue != '') {
            applyBackgroundTransparence(newValue.backgroundTransparency);
            handleEditMode(newValue.editMode)
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

    // Changes the Game information text from the replicant, such as System, Category, Estimate and Game name
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

    // Sets the current time of the timer.
    function setTime(timeHTML) {
        $timerInfo.html(timeHTML);
        currentTime = timeHTML;
    }

    // Gets the runner with index 'index' in the runnerarray's nickname from the rundata Replicant
    function getRunnerInformationName(runnerDataArray, index) {
        if(typeof runnerDataArray[index] === 'undefined') {
            console.log("Player nonexistant!");
            return "";
        }
        return runnerDataArray[index].names.international;
    }

    // Gets the runner with index 'index' in the runnerarray's twitch URL from the rundata Replicant
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

    function addEditModeDebugInformation() {
        $('#positionDebug').css('opacity','0.5');
    }

    function removeEditModeDebugInformation(){
        $('#positionDebug').css('opacity','0');
    }

    // When we reposition an element we are dragging we need to update coordinates as well as the current DOM ID
    function updateDebugInformation( event, ui ) {
        var debugInformationText = '';
        debugInformationText += " Item ID: " + ui.helper[0].id;
        debugInformationText += " X: " + $('#' + ui.helper[0].id).offset().left;
        debugInformationText += " Y: " + $('#' + ui.helper[0].id).offset().top;
        debugInformationText += " Width: " + $('#'+ui.helper[0].id).width();
        debugInformationText += " Height: " + $('#'+ui.helper[0].id).height();
        $('#positionDebugText').html(debugInformationText);
    }

    function revertChanges() {
        //TODO: do thiiis
    }

    function convertToTrueAspectRatio(aspectRatioString) {
        var numbers = aspectRatioString.split(':');
        var realNumber = Number(numbers[0])/Number(numbers[1]);
        return realNumber;
    }

    function handleEditMode(isEnabled) {
        if(isEnabled) {
            addEditModeDebugInformation();
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
                drag: updateDebugInformation,
                start: function( event, ui ) {
                    $('#'+ui.helper[0].id).css('z-index','100');
                },
                stop: function( event, ui ) {
                    $('#'+ui.helper[0].id).css('z-index','0');
                }
            });

            var aspectRatio = $('.gameCapture').attr('aspect-ratio');
            var trueAspectRatio = convertToTrueAspectRatio(aspectRatio);

            $('.gameCapture').first().resizable({
                start: function (event, ui) {
                    $('#'+ui.helper[0].id).css('z-index','100');
                },
                aspectRatio: trueAspectRatio,
                resize: updateDebugInformation,
                alsoResize: ".gameCapture",
                stop: function( event, ui ) {
                    $('#'+ui.helper[0].id).css('z-index','0');
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
                removeEditModeDebugInformation();
            }
        }
    }

    // Edit Mode functions END ###
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

    function generateCssForLayout() {
        var completeCss = '';
        $('.positionable').each(function() {
            var cssTemplate = "#itemid {\n    position: fixed;\n    top: topValue;\n    left: leftValue;\n    width: widthValue;\n    height: heightValue;\n}\n\n";
            var itemID = $(this).attr('id');
            var topOffset = $(this).offset().top;
            var leftOffset = $(this).offset().left;
            var width = $(this).width();
            var height = $(this).height();

            cssTemplate = cssTemplate.replace('itemid',itemID);
            cssTemplate = cssTemplate.replace('topValue',topOffset);
            cssTemplate = cssTemplate.replace('leftValue',leftOffset);
            cssTemplate = cssTemplate.replace('widthValue',width);
            cssTemplate = cssTemplate.replace('heightValue',height);
            completeCss += cssTemplate;
        });
        console.log(completeCss);
        return completeCss;
    }

    function loadCSS (href) {
        var cssLink = $("<link rel='stylesheet' type='text/css' href='"+href+"'>");
        $("head").append(cssLink);
    };

    //
    // Layout initialization (runs once when the overlay loads)
    //

    $runnerTimerFinishedElements.each( function( index, e ){
        hideTimerFinished(index);
    });

    $twitchLogos.each( function(index, element) {
        $(this).css('transform', 'scale(0)');
    });

    $generateCSSContentButton.click(function(){
        var cssGenerationObject = {};
        cssGenerationObject.sceneID = sceneID;
        cssGenerationObject.generatedCss = generateCssForLayout();
        nodecg.sendMessage("createCustomCss",cssGenerationObject);
    });

    $resetCSSContentButton.click(function(){
        var cssResetObject = {};
        cssResetObject.sceneID = sceneID;
        nodecg.sendMessage("deleteCustomCss",cssResetObject);
        location.reload();
    });

    $gameCaptures.each(function () {
        var aspectRatio = $(this).attr('aspect-ratio');

        // Don't initialize width and height if it already exists in custom css
        if($(this).css("width") != '0px' || $(this).css("height") != '0px') {
            return;
        }

        switch(aspectRatio) {
            case '4:3':
                $(this).addClass('aspect4_3');
                break;
            case '16:9':
                $(this).addClass('aspect16_9');
                break;
            case '3:2':
                $(this).addClass('aspect3_2');
                break;
        }
    });

    loadCSS("/graphics/nodecg-speedcontrol/css/editcss/"+sceneID+".css");

    // If we are live, we strip the overlay of the debug element
    if (nodecg.bundleConfig && (typeof nodecg.bundleConfig.live !== 'undefined' && nodecg.bundleConfig.live === true)) {
        $('#positionDebug').remove();
    }

    });
