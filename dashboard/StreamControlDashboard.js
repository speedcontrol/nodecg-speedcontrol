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
		
	if (nodecg.bundleConfig && nodecg.bundleConfig.twitch && nodecg.bundleConfig.twitch.enable) {
		$streamControlInit.hide();
		$('#twitchAuthLink').show();
		
		// Change "Connect with Twitch" button link to be correct to the config settings.
		$('#twitchAuthLink a').attr('href', 'https://api.twitch.tv/kraken/oauth2/authorize?client_id='+nodecg.bundleConfig.twitch.clientID+'&redirect_uri='+nodecg.bundleConfig.twitch.redirectURI+'&response_type=code&scope=channel_editor+user_read+chat_login+channel_commercial&force_verify=true');
	}
	
	$enableTwitchSynchronizationRadios.controlgroup();
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
	
	$playTwitchAdButton.click(() => {
		nodecg.sendMessage('playTwitchAd', (err, data) => {
			if (!err) {
				$playTwitchAdButton.button({disabled: true});
				setTimeout(function() {
					$playTwitchAdButton.button({disabled: false});
				}, 180000);
			}
		});
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
	var accessTokenReplicant = nodecg.Replicant('twitchAccessToken');
	accessTokenReplicant.on('change', function(newValue, oldValue) {
		if (newValue && nodecg.bundleConfig && nodecg.bundleConfig.twitch && nodecg.bundleConfig.twitch.enable) {
			$streamControlHideShow.show();
			$('#twitchAuthLink').hide();
			
			// Removes FFZ related stuff from the panel if that feature is not enabled.
			if (!nodecg.bundleConfig.twitch.ffzIntegration) {
				$streamControlTwitchNames.hide();
				$helpMessage.text('Auto-sync title/game?');
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
			if (newValue.status) {$streamControlTitle.val(newValue.status);}
			if (newValue.game) {$streamControlGame.val(newValue.game);}
			
			// Remove ad button if the channel isn't partnered.
			if (newValue.partner) $playTwitchAdButton.show();
			else $playTwitchAdButton.hide();
		}
	});
});