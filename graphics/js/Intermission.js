'use strict';
$(function () {

    // The name of the speedcontrol bundle that's used whenever a replicant or
    // message needs to be used

    var speedcontrolBundle = 'nodecg-speedcontrol';
	
	// If you want to automatically run a twitch ad on scene visibility in OBS, make a 
	// duplicate intermission scene with this special scene name
	
	var autoAdScene = 'Intermission [Advert]';

    // JQuery selector initialiation ###

    var $comingUpGame = $('#comingUpGame');
    var $comingUpCathegory = $('#comingUpCathegory');
    var $comingUpSystem = $('#comingUpSystem');
    var $comingUpPlayer = $('#comingUpPlayer');

    var $justMissedGame = $('#justMissedGame');
    var $justMissedCathegory = $('#justMissedCathegory');
    var $justMissedSystem = $('#justMissedSystem');
    var $justMissedPlayer = $('#justMissedPlayer');

    var isInitialized = false;

    // sceneID must be uniqe for this view, it's used in positioning of elements when using edit mode
    // if there are two views with the same sceneID all the elements will not have the correct positions
    var sceneID = $('html').attr('data-sceneid');

    // Replicants ###
    var sceneLayoutConfigurationReplicant = nodecg.Replicant('sceneLayoutConfiguration', speedcontrolBundle);
    sceneLayoutConfigurationReplicant.on('change', function(newVal, oldVal) {
        if(typeof newValue !== 'undefined' && newValue != "") {
            applyBackgroundTransparence(newVal.backgroundTransparency);
            handleEditMode(newVal.editMode)
        }
    });

    var runDataArrayReplicant = nodecg.Replicant("runDataArray", speedcontrolBundle);
    runDataArrayReplicant.on("change", function (newValue, oldValue) {
    });

    var runDataActiveRunReplicant = nodecg.Replicant("runDataActiveRun", speedcontrolBundle);
    runDataActiveRunReplicant.on("change", function (newValue, oldValue) {
        var indexOfCurrentRun = findIndexInDataArrayOfRun(newValue, runDataArrayReplicant.value);
        var indexOfNextRun = Number(indexOfCurrentRun) + Number(1);
        var comingUpRun = undefined;
        if(indexOfNextRun >= runDataArrayReplicant.value.length) {
        }
        else {
            comingUpRun = runDataArrayReplicant.value[indexOfNextRun];
        }
        if(!isInitialized) {
            updateMissedComingUp(newValue, comingUpRun);
            isInitialized = true;
        }
    });


    function findIndexInDataArrayOfRun(run, runDataArray) {
        var indexOfRun = -1;
        $.each(runDataArray, function (index, value) {
            if(run && value.runID == run.runID) {
                indexOfRun = index;
            }
        });
        return indexOfRun;
    }

    function updateMissedComingUp(currentRun, nextRun) {
        changeComingUpRunInformation(nextRun);
        changeJustMissedRunInformation(currentRun);
    }

    // Replicant functions ###
    function changeComingUpRunInformation(runData) {
        var game = "The End";
        var category = "";
        var system = "";

        if(typeof runData !== "undefined" && runData !== '') {
            game = runData.game;
            category =  runData.category;
            system = runData.system;
        }

        animation_setGameField($comingUpGame,game);
        animation_setGameField($comingUpCathegory,category);
        animation_setGameField($comingUpSystem,system);
    }

    function changeJustMissedRunInformation(runData) {
        var game = "The Beginning";
        var category = "";
        var system = "";

        if(typeof runData !== "undefined" && runData !== '') {
            game = runData.game;
            category =  runData.category;
            system = runData.system;
        }

        animation_setGameField($justMissedGame,game);
        animation_setGameField($justMissedCathegory,category);
        animation_setGameField($justMissedSystem,system);
    }

    // General functions ###

    function applyBackgroundTransparence(value) {
        if (value == 'On') {
            $('#window-container').css('opacity',0.5);
        }
        else if (value == 'Off') {
            $('#window-container').css('opacity',1.0);
        }
    }

    function loadCSS (css) {
        var cssLink = $("<link rel='stylesheet' type='text/css' href='/bundles/"+speedcontrolBundle+"/graphics/css/editcss/"+css+".css'>");
        $("head").append(cssLink);
    };
	
    loadCSS(sceneID);
	
	// Listen for 'force refresh intermission' button
	nodecg.listenFor("forceRefreshIntermission", speedcontrolBundle, function() {
		isInitialized = false;
		
		if(typeof runDataActiveRunReplicant.value == 'undefined' || runDataActiveRunReplicant.value == "") {
			   //return;
		}
		
		var indexOfCurrentRun = findIndexInDataArrayOfRun(runDataActiveRunReplicant.value, runDataArrayReplicant.value);
		var indexOfNextRun = Number(indexOfCurrentRun) + Number(1);
		var comingUpRun = undefined;
		
		if(indexOfNextRun >= runDataArrayReplicant.value.length) {
		}
		else {
			comingUpRun = runDataArrayReplicant.value[indexOfNextRun];
		}
		
		if(!isInitialized) {
			updateMissedComingUp(runDataActiveRunReplicant.value, comingUpRun);
			isInitialized = true;
		}
	});
	
	// Twitch ad on scene load (by Planks)
	// Configure autoAdScene at top of this file. An ad runs if the scene name matches this.
	// This script uses the visibility callback documented on https://github.com/kc5nra/obs-browser/blob/master/README.md
	// to call playTwitchAd in twitchapi.js 
	
	window.obsstudio.onVisibilityChange = function(visiblity) {
		window.obsstudio.getCurrentScene(function(data) {
			var sceneobj = JSON.parse(data);
			if (sceneobj.name == autoAdScene) {
				nodecg.sendMessageToBundle('playTwitchAd', 'nodecg-speedcontrol');
			};
		});
	};
});
