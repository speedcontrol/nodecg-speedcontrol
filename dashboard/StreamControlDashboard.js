'use strict';
$(function() {
	var autoUpdateTwitchBoxes = true;
    var $streamControlHideShow = $('#streamControlHideShow');
	var $helpMessage = $("#helpMessage");
    var $streamControlTitle = $('#streamControlTitle');
    var $streamControlGame = $('#streamControlGame');
    var $streamControlTwitchNames = $('#streamControlTwitchNames');
    var $streamControlSubmit = $('#streamControlSubmit');
	var $streamControlInit = $('#streamControlInit');
    var $enableTwitchSynchronizationRadios = $('#enableTwitchSynchronization');
    var $enableTwitchSynchronizationRadio = $('input[name=enableTwitchSynchronizationRadio]');
	var $playTwitchAdButton = $('#playTwitchAdButton');
    var errorMessage = "If you want to use the twitch functionality, you need to create a file called nodecg-speedcontrol.json in nodecg/cfg and fill it with:\n" +
        "{\n" +
        "\"enableTwitchApi\": true\n" +
        "\"user\": \"twitchusername\"\n" +
        "}\n" +
        "exchange username with the twitch username which you want to access"
		
	$enableTwitchSynchronizationRadios.buttonset();
    $streamControlSubmit.button();
	$playTwitchAdButton.button();
	
    var streamControlConfigurationReplicant = nodecg.Replicant('streamControlConfiguration');
    streamControlConfigurationReplicant.on('change', function (newVal, oldVal) {
        if (typeof newVal !== 'undefined') {
            if (newVal.synchronizeAutomatically != null && newVal.synchronizeAutomatically == true) {
                $('#enableTwitchSynchronizationRadioOn')[0].checked = true;
				$enableTwitchSynchronizationRadios.buttonset('refresh');
            }
        }
    });

    $enableTwitchSynchronizationRadio.change(function () {
        var configuration = streamControl_GetOrCreateStreamControlConfiguration();
        configuration.synchronizeAutomatically = $(this).val() == "On";
        streamControlConfigurationReplicant.value = configuration;
    });

	// When the user clicks inside of the title/game editing box, stop it from updating automatically for 60 seconds.
	$streamControlTitle.click(function () {
		if (autoUpdateTwitchBoxes) {autoUpdateTwitchBoxes = false; setTimeout(function() {autoUpdateTwitchBoxes = true;}, 60000);}
	});
	$streamControlGame.click(function () {
		if (autoUpdateTwitchBoxes) {autoUpdateTwitchBoxes = false; setTimeout(function() {autoUpdateTwitchBoxes = true;}, 60000);}
	});

    $streamControlSubmit.click(function () {
        if (typeof nodecg.bundleConfig.user === 'undefined' || typeof nodecg.bundleConfig.enableTwitchApi === 'undefined') {
            alert(errorMessage);
            return;
        }
        var title = $streamControlTitle.val();
        var game = $streamControlGame.val();
        var twitch = $streamControlTwitchNames.val();
        var requestObject = {};
        requestObject.channel = {};

        if(title != "") {
            requestObject.channel.status = title;
        }
        if(game != "") {
            requestObject.channel.game = game;
        }

		var twitchNames = [];
		if (twitch != '') {
			twitchNames = twitch.replace(' ', '').split(',');
		}

		autoUpdateTwitchBoxes = true
		nodecg.sendMessage('updateFFZFollowing', twitchNames);
        if (title != '' || game != '') {nodecg.sendMessage('updateChannel',requestObject);}
    });
	
	$playTwitchAdButton.click(function() {
		if (typeof nodecg.bundleConfig.user === 'undefined' || typeof nodecg.bundleConfig.enableTwitchApi === 'undefined') {
            alert(errorMessage);
            return;
        }
		
		nodecg.sendMessage('playTwitchAd');
		$playTwitchAdButton.button({disabled: true});
		setTimeout(function() {
			$playTwitchAdButton.button({disabled: false});
		}, 60000);
	});

    function streamControl_GetOrCreateStreamControlConfiguration() {
        var configuration = streamControlConfigurationReplicant.value;
        if (typeof configuration !== 'undefined' && configuration !== '') {
            return configuration;
        }
        else {
            return streamControl_CreateStreamControlConfiguration();
        }
    }

    function streamControl_CreateStreamControlConfiguration() {
        var configuration = {};
        configuration.synchronizeAutomatically = false;
        return configuration;
    }

	// Checks if the access token has been set yet or not on page load.
	// If not, gets one, if it has already got one, changes the buttons.
	var accessTokenReplicant = nodecg.Replicant('twitchAccessToken', {persistent: false});
	accessTokenReplicant.on('change', function(newValue, oldValue) {
		if (newValue) {
			$streamControlInit.hide();
			$streamControlHideShow.show();
			
			// Removes FFZ related stuff from the panel if that feature is not enabled.
			if (!nodecg.bundleConfig.enableFFZIntegration) {
				$streamControlTwitchNames.hide();
				$helpMessage.text('Automatically synchronize active game to Twitch?');
			}
		}
	});
	
	// Used to update the contents of the FFZ follow box when it has changed.
	var ffzFollowButtonsReplicant = nodecg.Replicant('ffzFollowButtons', {persistent: false});
	ffzFollowButtonsReplicant.on('change', function(newValue, oldValue) {
		newValue = newValue || [];
		$streamControlTwitchNames.val(newValue.join(', '));
	});

	// Used to update the contents of the title/game box automatically frequently.
	var twitchChannelInfoReplicant = nodecg.Replicant('twitchChannelInfo', {persistent: false});
	twitchChannelInfoReplicant.on('change', function(newValue, oldValue) {
		if (newValue && autoUpdateTwitchBoxes) {
			if (newValue['status']) {$streamControlTitle.val(newValue['status']);}
			if (newValue['game']) {$streamControlGame.val(newValue['game']);}
		}
	});
});