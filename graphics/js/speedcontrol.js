'use strict';
$(function () {

    // The name of the speedcontrol bundle that's used whenever a replicant or
    // message needs to be used

    var speedcontrolBundle = 'nodecg-speedcontrol';

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
    var timeoutTwitch = new Array();
    var timeoutName = new Array();

    var teamRotationInterval = null;

    // sceneID must be unique for this view, it's used in positioning of elements when using edit mode
    // if there are two views with the same sceneID all the elements will not have the correct positions
    var sceneID = $('html').attr('data-sceneid');

    // NodeCG Message subscription ###
    nodecg.listenFor("resetTime", speedcontrolBundle, resetAllPlayerTimers);
    nodecg.listenFor('timerReset', speedcontrolBundle, resetTimer);
    nodecg.listenFor('timerSplit', speedcontrolBundle, splitTimer);

    var stopWatchReplicant = nodecg.Replicant('stopwatch',speedcontrolBundle);
    stopWatchReplicant.on("change", function (newValue, oldValue) {
        if (!newValue) return;
        var time  = newValue.time || '88:88:88';
        if( oldValue )
        {
          $timerInfo.toggleClass('timer_'+oldValue.state,false);
        }
        $timerInfo.toggleClass('timer_'+newValue.state,true);
        setTime(time);
    });

    var teamMemberIndices = new Array();
    var runDataActiveRunReplicant = nodecg.Replicant("runDataActiveRun",speedcontrolBundle);
    runDataActiveRunReplicant.on("change", function (newValue, oldValue) {

        if(typeof newValue !== 'undefined' && newValue != '' ) {
            teamMemberIndices = new Array();
            for (var i=0; i < newValue.teams.length; i++) {
              teamMemberIndices[i]=0;
            }
            setTeamData(newValue);
            updateSceneFields(newValue);
        }
		
		else {
			animation_setGameField($runInformationName,'The Beginning');
		}
    });


    var teamIntervals = new Array();
    function setTeamData( runData ) {
      clearTimeouts();
      $('.team').each( function(index, teamDiv) {
        if (index >= runData.teams.length) {
          $(teamDiv).find('.name').html('');
          $(teamDiv).find('ul.teamList').html('');
          $(teamDiv).find('.runnerInfo').html('');

          return;
        }
        var team = runData.teams[index];
        $(teamDiv).toggleClass('singleMember',team.members.length < 2);
        $(teamDiv).find('.name').html(team.name);
        var teamList = $(teamDiv).find('ul.teamList');
        if (teamList) {
          $(teamList).html('');
          team.members.forEach( function(member, j) {
            var li = document.createElement("li");
            $(li).html(member.names.international);
            $(teamList).append(li);
          });
        }
        rotateTeamMember(teamDiv, index, 0);
        teamMemberIndices[index] = teamMemberIndices[index]+1;
        if (teamMemberIndices[index] >= team.members.length) {
          teamMemberIndices[index] = 0;
        }
      });

      if (teamRotationInterval) {
        clearInterval(teamRotationInterval);
      }
      teamRotationInterval = setInterval(rotateTeamMembers, 20000);
    }




    function rotateTeamMember( teamDiv, teamIndex, memberIndex ) {
      if (typeof runDataActiveRunReplicant.value === 'undefined' ) {
        return;
      }
      var nameDelay = 10;
      var twitchDelay = 12000;
      var runnerInfo = $(teamDiv).find('.playerContainer .runnerInfo');

      timeoutName.push(setTimeout( animation_setGameFieldAlternate, nameDelay, runnerInfo,
          runDataActiveRunReplicant.value.teams[teamIndex].members[memberIndex].names.international));

      timeoutName.push(setTimeout(hideLinkIcon, nameDelay));
      timeoutTwitch.push(setTimeout(animation_setGameFieldAlternate,  twitchDelay,runnerInfo,
          runDataActiveRunReplicant.value.teams[teamIndex].members[memberIndex].twitch.uri.replace(/https?:\/\/(www\.)?/,'')));
      timeoutTwitch.push(setTimeout(showLinkIcon, twitchDelay));
    }

    function showLinkIcon() {
      var tm = new TimelineMax({paused: true});
      $twitchLogos.each( function(index, element) {
         if($.inArray(index, []) == -1) {
              animation_showZoomIn($(this));
          }
      });
      tm.play();
    }

    function hideLinkIcon() {
      var tm = new TimelineMax({paused: true});
      $twitchLogos.each( function(index, element) {
         if($.inArray(index, []) == -1) {
              animation_hideZoomOut($(this));
          }
      });
      tm.play();
    }

    function clearTimeouts() {

      timeoutName.forEach( function(timeout, index) {
        clearTimeout(timeout);
      });
      timeoutTwitch.forEach( function(timeout, index) {
        clearTimeout(timeout);
      });
      timeoutName.length = 0;
      timeoutTwitch.length = 0;
    }

    function rotateTeamMembers(immediate) {
      if (typeof runDataActiveRunReplicant.value === 'undefined' ) {
        return;
      }
      var teams = runDataActiveRunReplicant.value.teams;
      clearTimeouts();
      teams.forEach( function(team, index){
        rotateTeamMember($('#team'+(index+1)), index, teamMemberIndices[index]);
        teamMemberIndices[index] = teamMemberIndices[index]+1;
        if (teamMemberIndices[index] >= team.members.length) {
          teamMemberIndices[index] = 0;
        }
      });
    }

    var runDataActiveRunRunnerListReplicant = nodecg.Replicant("runDataActiveRunRunnerList",speedcontrolBundle);

    // Replicant functions ###

    // Changes the Game information text from the replicant, such as System, Category, Estimate and Game name
    function updateSceneFields(runData) {
        var runInfoGameName = runData.game;
        var runInfoGameEstimate = runData.estimate;
        var runInfoGameSystem = runData.system;
        var runInfoGameCategory = runData.category;

        animation_setGameField($runInformationSystem,runInfoGameSystem);
        animation_setGameField($runInformationCategory,runInfoGameCategory);
        animation_setGameField($runInformationEstimate,runInfoGameEstimate);
        animation_setGameField($runInformationName,runInfoGameName);
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
        animation_fadeInOpacity($runnerTimerFinishedContainers.eq(index));
    }

    function displayTwitchInstead() {
        var indexesToNotUpdate = [];
        $runnerInfoElements.each(function(index,element) {
            if(getRunnerInformationTwitch(runDataActiveRunRunnerListReplicant.value,index) == '---') {
                indexesToNotUpdate.push(index);
            }
            else {
                animation_setGameFieldAlternate($(this), getRunnerInformationTwitch(runDataActiveRunRunnerListReplicant.value, index));
            }
        });

        var tm = new TimelineMax({paused: true});
        $twitchLogos.each( function(index, element) {
            if($.inArray(index, indexesToNotUpdate) == -1) {
                animation_showZoomIn($(this));
            }
        });

        tm.play();
        timeoutTwitch = setTimeout(hideTwitch,displayTwitchforMilliseconds);
    }

    function hideTimerFinished(index) {
        $runnerTimerFinishedContainers.eq(index).css("opacity","0");
    }

    function loadCSS (css) {
        var cssLink = $("<link rel='stylesheet' type='text/css' href='/bundles/"+speedcontrolBundle+"/graphics/css/editcss/"+css+".css'>");
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

    loadCSS(sceneID);
});
