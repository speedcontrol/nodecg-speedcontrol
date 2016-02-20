'use strict';
$(function () {
    // JQuery selector initialiation ###

    var $comingUpGame = $('#comingUpGame');
    var $comingUpCathegory = $('#comingUpCathegory');
    var $comingUpSystem = $('#comingUpSystem');
    var $comingUpPlayer = $('#comingUpPlayer');

    var $justMissedGame = $('#justMissedGame');
    var $justMissedCathegory = $('#justMissedCathegory');
    var $justMissedSystem = $('#justMissedSystem');
    var $justMissedPlayer = $('#justMissedPlayer');

    // sceneID must be uniqe for this view, it's used in positioning of elements when using edit mode
    // if there are two views with the same sceneID all the elements will not have the correct positions
    var sceneID = "Intermission";

    // Temporary container used for edit mode to store all element position data. See createPositioningConfig()
    var itemPositioningConfigurationContainer = [];

    var isEditModeEnabled = false;

    var isInitialized = false;

    // NodeCG Message subscription ###
    nodecg.listenFor('savePositionConfiguration', saveConfiguration);
    nodecg.listenFor('revertToDefault', revertChanges);
    nodecg.listenFor('backgroundTransparance', applyBackgroundTransparence);
    nodecg.listenFor("displayMarqueeInformation", displayMarquee);
    nodecg.listenFor("removeMarqueeInformation", removeMarquee);

    // Replicants ###
    var sceneLayoutConfigurationReplicant = nodecg.Replicant('sceneLayoutConfiguration');
    sceneLayoutConfigurationReplicant.on('change', function(oldVal, newVal) {
        if(typeof newValue !== 'undefined' && newValue != "") {
            applyBackgroundTransparence(newVal.backgroundTransparency);
            handleEditMode(newVal.editMode)
        }
    });

    var runDataArrayReplicant = nodecg.Replicant("runDataArray");
    runDataArrayReplicant.on("change", function (oldValue, newValue) {


    });

    var runDataActiveRunReplicant = nodecg.Replicant("runDataActiveRun");
    runDataActiveRunReplicant.on("change", function (oldValue, newValue) {
        if(typeof newValue == 'undefined' || newValue == "") {
            return;
        }

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
            if(value.runID == run.runID) {
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
        var game = "END";
        var category = "";
        var system = "";

        if(typeof runData !== "undefined") {
            game = runData.game;
            category =  runData.category;
            system = runData.system;
        }

        setGameField($comingUpGame,game);
        setGameField($comingUpCathegory,category);
        setGameField($comingUpSystem,system);
    }

    function changeJustMissedRunInformation(runData) {
        var game = "END";
        var category = "";
        var system = "";

        if(typeof runData !== "undefined") {
            game = runData.game;
            category =  runData.category;
            system = runData.system;
        }

        setGameField($justMissedGame,game);
        setGameField($justMissedCathegory,category);
        setGameField($justMissedSystem,system);
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
        $('#informationMarquee').html(text);
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
