'use strict';
$(function () {
    // JQuery selector initialiation ###

    // sceneID must be uniqe for this view, it's used in positioning of elements when using edit mode
    // if there are two views with the same sceneID all the elements will not have the correct positions
    var sceneID = "Intermission";

    // Temporary container used for edit mode to store all element position data. See createPositioningConfig()
    var itemPositioningConfigurationContainer = [];

    var isEditModeEnabled = false;

    // NodeCG Message subscription ###
    nodecg.listenFor('savePositionConfiguration', saveConfiguration);
    nodecg.listenFor('revertToDefault', revertChanges);
    nodecg.listenFor('backgroundTransparance', applyBackgroundTransparence);
    nodecg.listenFor("displayMarqueeInformation", displayMarquee);
    nodecg.listenFor("removeMarqueeInformation", removeMarquee);

    // Replicants ###
    var scenePositioningConfigurationReplicant = nodecg.Replicant("scenePositioningConfiguration");
    scenePositioningConfigurationReplicant.on("change", function (oldValue, newValue) {
        if(typeof newValue !== 'undefined') {
            updateItemPositions(newValue);
        }
    });

    var sceneLayoutConfigurationReplicant = nodecg.Replicant('sceneLayoutConfiguration');
    sceneLayoutConfigurationReplicant.on('change', function(oldVal, newVal) {
        if(typeof newVal !== 'undefined') {
            applyBackgroundTransparence(newVal.backgroundTransparency);
            handleEditMode(newVal.editMode)
        }
    });

    var runDataArrayReplicant = nodecg.Replicant("runDataArray");
    runDataArrayReplicant.on("change", function (oldValue, newValue) {


    });

    var runDataActiveRunReplicant = nodecg.Replicant("runDataActiveRun");
    runDataActiveRunReplicant.on("change", function (oldValue, newValue) {
        var indexOfCurrentRun = findIndexInDataArrayOfRun(newValue, runDataArrayReplicant.value);
        var indexOfNextRun = Number(indexOfCurrentRun) + Number(1);
        var comingUpRun = undefined;
        if(indexOfNextRun >= runDataArrayReplicant.value.length) {
        }
        else {
            comingUpRun = runDataArrayReplicant.value[indexOfNextRun];
        }
        updateMissedComingUp(newValue, comingUpRun);
    });


    function findIndexInDataArrayOfRun(run, runDataArray) {
        var indexOfRun = -1;
        $.each(runDataArray, function (index, value) {
            if(value.runID == run.runID) {
                indexOfRun = index;
            }
        });
        return indexOfRun;
    }

    function updateMissedComingUp(currentRun, nextRun) {
        var htmlCurrentRun = getRunInformationTable(currentRun);
        var htmlNextRun = getRunInformationTable(nextRun);
        setGameField($('#comingUpRun'),htmlNextRun);
        setGameField($('#justMissedRun'),htmlCurrentRun);
    }

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

    function getRunInformationTable(runData) {
        var game = "END";
        var category = "";
        var system = "";

        if(typeof runData !== "undefined") {
            game = runData.game;
            category =  runData.category;
            system = runData.system;
        }

        var bodyHtml = '<table class="table-information">'+
            '<tr><td class="rowTitleGame">'+ game +'</td><td class="rowTitleGame"></td></tr>' +
            '<tr><td class="rowTitleGame">'+ category +'</td><td class="rowTitleGame">' + system + '</td></tr>' +
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

    // Transition to change html from current to nextHtml
    function setGameField($selector, nextHtml) {
        var tm = new TimelineMax({paused: true});
        tm.to($selector, 0.3, {opacity: '0',  ease: Quad.easeOut },'0');
        tm.to($selector, 0.3, {opacity: '1', onStart:updateSelectorText, onStartParams:[$selector, nextHtml] ,ease: Quad.easeOut },'0.3');
        tm.play();
    }

    // Function just sets the text of the DOM element
    function updateSelectorText($textDivToUpdate, newHtml) {
        $textDivToUpdate.html(newHtml);
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

    function displayMarquee(text) {
        $('#informationMarquee').text(text);
        $('#informationMarquee').marquee({
            duration: 15000
        });
        var tm = new TimelineMax({paused: true});
        tm.to($('#informationMarquee'), 1.0, {opacity: '1', height: "50px",  ease: Quad.easeOut },'0');
        tm.play();
    }

    function removeMarquee() {
        var tm = new TimelineMax({paused: true});
        tm.to($('#informationMarquee'), 1.0, {opacity: '0', height: "0px",  ease: Quad.easeOut },'0');
        tm.play();
    }
});
