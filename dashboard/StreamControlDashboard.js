'use strict';
$(function () {
	var autoUpdateTwitchBoxes = true;
    var $streamControlHideShow = $('#streamControlHideShow');
    var $streamControlTitle = $('#streamControlTitle');
    var $streamControlGame = $('#streamControlGame');
    var $streamControlTwitchNames = $('#streamControlTwitchNames');
    var $streamControlSubmit = $('#streamControlSubmit');
    var $streamControlInit = $('#streamControlInit');
    var $enableTwitchSynchronizationRadios = $('#enableTwitchSynchronization');
    var $enableTwitchSynchronizationRadio = $('input[name=enableTwitchSynchronizationRadio]');
    var errorMessage = "If you want to use the twitch functionality, you need to create a file called nodecg-speedcontrol.json in nodecg/cfg and fill it with:\n" +
        "{\n" +
        "\"enableTwitchApi\": true\n" +
        "\"user\": \"twitchusername\"\n" +
        "}\n" +
        "exchange username with the twitch username which you want to access"
    var streamControlConfigurationReplicant = nodecg.Replicant('streamControlConfiguration');
    streamControlConfigurationReplicant.on('change', function (newVal, oldVal) {
        if (typeof newVal !== 'undefined') {
            if (newVal.synchronizeAutomatically != null && newVal.synchronizeAutomatically == true) {
                var radio = $('#enableTwitchSynchronizationRadioOn');
                radio[0].checked = true;
                radio.button("refresh");
            }
        }
    });

    nodecg.listenFor('twitchLoginAuthorization',redirectTwitchAuthorization);
    nodecg.listenFor('twitchLoginSuccessful',streamControl_loginSuccessful);

    $enableTwitchSynchronizationRadios.buttonset();
    $streamControlSubmit.button({disabled: true});
    $streamControlInit.button();

    $enableTwitchSynchronizationRadio.change(function () {
        var configuration = streamControl_GetOrCreateStreamControlConfiguration();
        configuration.synchronizeAutomatically = $(this).val() == "On";
        streamControlConfigurationReplicant.value = configuration;
    });

    $streamControlInit.click(function () {
        streamControl_login();
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

    function streamControl_loginSuccessful() {
		$streamControlInit.hide();
        $streamControlSubmit.button({disabled: false});
		$streamControlHideShow.show();
    }

    function redirectTwitchAuthorization(URL) {
        console.log("Redirecting to " + URL);
        window.top.location = URL;
    }

    function streamControl_login(automatic) {
        if (nodecg.bundleConfig &&(typeof nodecg.bundleConfig.user !== 'undefined' && typeof nodecg.bundleConfig.enableTwitchApi !== 'undefined') &&
            nodecg.bundleConfig.enableTwitchApi == true) {
            if(getParameterByName('code') == null || getParameterByName('code') == "") {
                nodecg.sendMessage('twitchLogin');
            }
        }
        else if(automatic != true) {
            if (!nodecg.bundleConfig || (typeof nodecg.bundleConfig.user === 'undefined' || typeof nodecg.bundleConfig.enableTwitchApi === 'undefined') || nodecg.bundleConfig.enableTwitchApi != true) {
                alert(errorMessage);
                return;
            }
        }
    }

    function getParameterByName(name, url) {
        if (!url) url = window.top.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

	// Checks if the access token has been set yet or not on page load.
	// If not, gets one, if it has already got one, changes the buttons.
	var accessTokenReplicant = nodecg.Replicant('twitchAccessToken', {persistent: false});
	accessTokenReplicant.on('change', function(newValue, oldValue) {
		if (!newValue) {
			var parameter = getParameterByName('code');
			if(parameter != null && parameter != '') {
				nodecg.sendMessage('twitchLoginForwardCode', parameter);
				console.log("code is " + parameter);
			}

			streamControl_login(true);
		}

		else {streamControl_loginSuccessful();}
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
			console.log(newValue);
			if (newValue['status']) {$streamControlTitle.val(newValue['status']);}
			if (newValue['game']) {$streamControlGame.val(newValue['game']);}
		}
	});
});
