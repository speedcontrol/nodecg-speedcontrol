$(function () {
    var $submitMarqueeInformationButton = $('#submitMarqueeInformationButton');
    var $removeMarqueeInformationButton = $('#removeMarqueeInformationButton');
    var textToDisplay = $('#textToDisplay');
    $submitMarqueeInformationButton.button();
    $removeMarqueeInformationButton.button();

    $submitMarqueeInformationButton.click(function () {
        nodecg.sendMessage("displayMarqueeInformation", textToDisplay.val());
    });

    $removeMarqueeInformationButton.click(function () {
        nodecg.sendMessage("removeMarqueeInformation");
    });
})
