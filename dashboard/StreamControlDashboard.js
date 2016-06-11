'use strict';
$(function () {
    var $streamControlTitle = $('#streamControlTitle');
    var $streamControlGame = $('#streamControlGame');
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
    streamControlConfigurationReplicant.on('change', function (oldVal, newVal) {
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

    $streamControlSubmit.click(function () {
        if (typeof nodecg.bundleConfig.user === 'undefined' || typeof nodecg.bundleConfig.enableTwitchApi === 'undefined') {
            alert(errorMessage);
            return;
        }
        var title = $streamControlTitle.val();
        var game = $streamControlGame.val();
        var requestObject = {};
        requestObject.channel = {};

        if(title == '' && game == '') {
            alert("You need to fill in at least one field");
            return;
        }

        if(title != "") {
            requestObject.channel.status = title;
        }
        if(game != "") {
            requestObject.channel.game = game;
        }

        nodecg.sendMessage('updateChannel',requestObject);
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
        $streamControlInit.button({disabled: true});
        $streamControlInit.text("Already logged into twitch");
        $streamControlSubmit.button({disabled: false});
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

    var parameter = getParameterByName('code');
    if(parameter != null && parameter != '') {
        nodecg.sendMessage('twitchLoginForwardCode', parameter);
        console.log("code is " + parameter);
    }

    streamControl_login(true);
});


