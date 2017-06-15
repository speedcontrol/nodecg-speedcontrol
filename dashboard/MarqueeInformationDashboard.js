$(function () {
    var $submitMarqueeInformationButton = $('#submitMarqueeInformationButton');
    //var $removeMarqueeInformationButton = $('#removeMarqueeInformationButton');
    //var $temporarilyDisplayMarqueeInformationButton = $('#temporarilyDisplayMarqueeInformationButton');
    var textToDisplay = $('#textToDisplay');
    $submitMarqueeInformationButton.button();
    //$removeMarqueeInformationButton.button();
    //$temporarilyDisplayMarqueeInformationButton.button();

    $submitMarqueeInformationButton.click(function () {
        //nodecg.sendMessage("displayMarqueeInformation", textToDisplay.val());
		nodecg.sendMessage("infoBarCustomMsg", textToDisplay.val());
		$submitMarqueeInformationButton.button({disabled: true});
		setTimeout(function() {
			$submitMarqueeInformationButton.button({disabled: false});
		}, 10000);
    });
	
	/*$temporarilyDisplayMarqueeInformationButton.click(function () {
        nodecg.sendMessage("displayMarqueeInformationTemp", textToDisplay.val());
    });*/

    /*$removeMarqueeInformationButton.click(function () {
        nodecg.sendMessage("removeMarqueeInformation");
    });*/
})
