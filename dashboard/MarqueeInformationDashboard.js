$(function () {
    var $submitMarqueeInformationButton = $('#submitMarqueeInformationButton');
    var $removeMarqueeInformationButton = $('#removeMarqueeInformationButton');
    var $temporarilyDisplayMarqueeInformationButton = $('#temporarilyDisplayMarqueeInformationButton');
    var textToDisplay = $('#textToDisplay');
	
	$('#horizontalButtons').controlgroup()
	$('#horizontalButtons').controlgroup({
		'direction': 'horizontal'
	});
    $submitMarqueeInformationButton.button();
    $removeMarqueeInformationButton.button();
    $temporarilyDisplayMarqueeInformationButton.button();

    $submitMarqueeInformationButton.click(function () {
        nodecg.sendMessage("displayMarqueeInformation", textToDisplay.val());
    });
	
	$temporarilyDisplayMarqueeInformationButton.click(function () {
        nodecg.sendMessage("displayMarqueeInformationTemp", textToDisplay.val());
    });

    $removeMarqueeInformationButton.click(function () {
        nodecg.sendMessage("removeMarqueeInformation");
    });
	
	// If enableMarqueePanel is undefined, we still want it to appear (default is true).
	if (nodecg.bundleConfig && nodecg.bundleConfig.enableMarqueePanel === false)
		$('#marqueeControlHideShow').hide();
	else
		$('#marqueeControlInit').hide();
})
