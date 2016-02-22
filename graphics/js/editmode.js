'use strict';
$(function () {
    var isEditModeEnabled = false;
    var $generateCSSContentButton = $('#generateCSSContentButton');
    var $resetCSSContentButton = $('#resetCSSContentButton');
    var $runnerTimerFinishedElements = $('.runnerTimerFinished');
    var $runnerTimerFinishedContainers = $('.runnerTimerFinishedContainer');

    // sceneID must be uniqe for this view, it's used in positioning of elements when using edit mode
    // if there are two views with the same sceneID all the elements will not have the correct positions
    var sceneID = $('html').attr('data-sceneid');

    var screenHeight = $(window).height();
    var screenWidth = $(window).width();
    console.log("height = " + screenHeight);
    var font = parseFloat($('body').css('font-size'));
    var scaleRatio = screenHeight / 720;
    console.log(scaleRatio*font + 'px');
    $('body').css('font-size',scaleRatio*font + 'px');

    // Replicants ###
    var sceneLayoutConfigurationReplicant = nodecg.Replicant('sceneLayoutConfiguration');
    sceneLayoutConfigurationReplicant.on('change', function(oldValue, newValue) {
        if(typeof newValue !== 'undefined' && newValue != '') {
            applyBackgroundTransparence(newValue.backgroundTransparency);
            handleEditMode(newValue.editMode)
        }
    });

    // Edit Mode functions ###

    function hideTimerFinished(index) {
        $runnerTimerFinishedContainers.eq(index).css("opacity","0");
    }

    function showTimerFinished(index) {
        var tm = new TimelineMax({paused: true});
        tm.to($runnerTimerFinishedContainers.eq(index), 0.5, {opacity: '1',  ease: Quad.easeOut },'0');
        tm.play();
    }

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
        debugInformationText += " Size: " + $('#'+ui.helper[0].id).width() + "x" + $('#'+ui.helper[0].id).height();
        $('#positionDebugText').html(debugInformationText);
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

            var trueAspectRatio = 1;
            if($('.gameCapture').length >= 1) {
                trueAspectRatio = getAspectRatio($('.gameCapture').attr('aspect-ratio'));
            }

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

            $('.resizable').each(function() {
                var options = {
                    start: function (event, ui) {
                        $('#' + ui.helper[0].id).css('z-index', '100');
                    },
                    resize: updateDebugInformation,
                    stop: function (event, ui) {
                        $('#' + ui.helper[0].id).css('z-index', '0');
                    }
                };

                if($(this).hasClass('keepproportion')) {
                    var aspectratio = Number($(this).width())/Number($(this).height());
                    options.aspectRatio = aspectratio;
                }

                $(this).resizable(options);
            });

        }
        else {
            if(isEditModeEnabled) {
                $('.positionable').removeClass("editableObject");
                $('.positionable').draggable("destroy");
                $('.gameCapture').first().resizable("destroy");
                $('.gameCapture').text("");
                $('.resizable').resizable("destroy");
                isEditModeEnabled = false;
                $('.dummyTextable').html("");
                $runnerTimerFinishedElements.each( function( index, e ){
                    hideTimerFinished(index);
                });
                removeEditModeDebugInformation();
            }
        }
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
            cssTemplate = cssTemplate.replace('topValue',topOffset/screenHeight * 100 + "%");
            cssTemplate = cssTemplate.replace('leftValue',leftOffset/screenWidth * 100 + "%");
            cssTemplate = cssTemplate.replace('widthValue',width/screenWidth * 100 + "%");
            cssTemplate = cssTemplate.replace('heightValue',height/screenHeight * 100 + "%");
            completeCss += cssTemplate;
        });
        return completeCss;
    }

    function applyBackgroundTransparence(applyTransparency) {
        if (applyTransparency) {
            $('#window-container').css('opacity',0.5);
        }
        else{
            $('#window-container').css('opacity',1.0);
        }
    }

    // Initialization, only runs once when page loads

    $generateCSSContentButton.click(function(){
        var cssGenerationObject = {};
        cssGenerationObject.sceneID = sceneID;
        cssGenerationObject.generatedCss = generateCssForLayout();
        // Below call will send a message to the csscreater.js extension
        // Which will create a custom css for the document importing this js in
        // css/editcss which is automatically imported when html file starts up
        nodecg.sendMessage("createCustomCss",cssGenerationObject);
    });

    $resetCSSContentButton.click(function(){
        var cssResetObject = {};
        cssResetObject.sceneID = sceneID;
        nodecg.sendMessage("deleteCustomCss",cssResetObject);
        location.reload();
    });

    // If we are live, we strip the overlay of the debug element
    if (nodecg.bundleConfig && (typeof nodecg.bundleConfig.live !== 'undefined' && nodecg.bundleConfig.live === true)) {
        $('#positionDebug').remove();
    }
});