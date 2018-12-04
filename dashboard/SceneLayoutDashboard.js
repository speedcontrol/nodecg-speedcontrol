$(function () {
	var $forceRefreshIntermissionButton = $('#forceRefreshIntermissionButton');
    $forceRefreshIntermissionButton.button();

	$forceRefreshIntermissionButton.click(function () {
        nodecg.sendMessage("forceRefreshIntermission");
    });
})
