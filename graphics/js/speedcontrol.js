'use strict';
$(function () {
    // JQuery selector initialiation ###
    var $timerInfo = $('#timer');
    var $runnerInfoElements = $('div.runnerInfo');
    var $runnerTimerFinishedElements = $('.runnerTimerFinished')
    var $runnerTimerFinishedContainers = $('.runnerTimerFinishedContainer');
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

    // NodeCG Message subscription ###
    nodecg.listenFor("resetTime", resetAllPlayerTimers);
    nodecg.listenFor('timerReset', resetTimer);
    nodecg.listenFor('timerSplit', splitTimer);

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
            twitchUrl = runnerDataArray[index].twitch.uri.replace("http://www.twitch.tv/","");
        }
        else {
            twitchUrl = "---";
        }
        return twitchUrl;
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
    function removeWillChange($selector) {
        $selector.css('will-change','');
    }

    function applyWillChange($selector) {
        $selector.css('will-change', 'transform, opacity');
    }

    // Transition to change html from current to nextHtml
    function setGameFieldAlternate($selector, nextHtml) {
       // applyWillChange($selector);
        var tm = new TimelineMax({paused: true});
        tm.to($selector, 0.5, {opacity: '0', transform: "scale(0)",  ease: Quad.easeOut },'0.2');
        tm.to($selector, 0.5, {opacity: '1', transform: "scale(1)", onStart:updateSelectorText, onStartParams:[$selector, nextHtml], onComplete:removeWillChange, onCompleteParams:[$selector], ease: Quad.easeOut },'0.7');
        tm.play();
    }

    // Transition to change html from current to nextHtml
    function setGameField($selector, nextHtml) {
        applyWillChange($selector);
        var tm = new TimelineMax({paused: true});
        tm.to($selector, 0.5, {opacity: '0', transform: "translateX(-50px)",  ease: Quad.easeOut },'0.2');
        tm.to($selector, 0.5, {opacity: '1', transform: "translateX(0px)", onStart:updateSelectorText, onComplete:removeWillChange, onCompleteParams:[$selector],  onStartParams:[$selector, nextHtml] ,ease: Quad.easeOut },'0.7');
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

    function loadCSS (href) {
        var cssLink = $("<link rel='stylesheet' type='text/css' href='"+href+"'>");
        $("head").append(cssLink);
    };

    function convertToTrueAspectRatio(aspectRatioString) {
        var numbers = aspectRatioString.split(':');
        var realNumber = Number(numbers[0])/Number(numbers[1]);
        return realNumber;
    }

    function addCssRule(rule, css) {
        css = JSON.stringify(css).replace(/"/g, "").replace(/,/g, ";");
        $("<style>").prop("type", "text/css").html(rule + css).appendTo("head");
    }

    function getAspectRatio(input) {
        switch(input) {
            case 'GB':
            case 'GBC':
                return convertToTrueAspectRatio("10:9");
                break;
            case 'HD':
                return convertToTrueAspectRatio("16:9");
                break;
            case '3DSBottom':
            case 'SD':
            case 'DS':
                return convertToTrueAspectRatio("4:3");
                break;
            case '3DSTop':
                return convertToTrueAspectRatio("5:3");
                break;
            case 'GBA':
                return convertToTrueAspectRatio("3:2");
                break;
            default:
                var numbers = input.split(':');
                var realNumber = Number(numbers[0])/Number(numbers[1]);
                return realNumber;
        }
    }

    //
    // Layout initialization (runs once when the overlay loads)
    //

    $runnerTimerFinishedElements.each( function( index, e ){
        hideTimerFinished(index);
    });

    $twitchLogos.each( function(index, element) {
        $(this).css('transform', 'scale(0)');
    });

    $gameCaptures.each(function () {
        var aspectRatioMultiplier = getAspectRatio($(this).attr('aspect-ratio'));
        var height = 200;
        var width = height * aspectRatioMultiplier;
        addCssRule("#"+$(this).attr('id'), {
            width: width+"px",
            height: height+"px"
        });
    });

    loadCSS("/graphics/nodecg-speedcontrol/css/editcss/"+sceneID+".css");
});
