'use strict';
var $streamControlTitle = $('#streamControlTitle');
var $streamControlGame = $('#streamControlGame');
var $streamControlSubmit = $('#streamControlSubmit');
var $streamControlInit = $('#streamControlInit');
var $enableTwitchSynchronizationRadios = $('#enableTwitchSynchronization');
var $enableTwitchSynchronizationRadio = $('input[name=enableTwitchSynchronizationRadio]');

var streamControlConfigurationReplicant = nodecg.Replicant('streamControlConfiguration');
streamControlConfigurationReplicant.on('change', function(oldVal, newVal) {
    if(typeof newVal !== 'undefined') {
        if (newVal.synchronizeAutomatically != null && newVal.synchronizeAutomatically == true) {
            var radio = $('#enableTwitchSynchronizationRadioOn');
            radio[0].checked = true;
            radio.button("refresh");
        }
    }
});

$enableTwitchSynchronizationRadios.buttonset();
$streamControlSubmit.button({disabled: true});
$streamControlInit.button();

$enableTwitchSynchronizationRadio.change(function() {
    var configuration = streamControl_GetOrCreateStreamControlConfiguration();
    configuration.synchronizeAutomatically = $(this).val() == "On";
    streamControlConfigurationReplicant.value = configuration;
});

function streamControl_GetOrCreateStreamControlConfiguration() {
    var configuration = streamControlConfigurationReplicant.value;
    if(typeof configuration !== 'undefined') {
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

$streamControlSubmit.click(function() {
    if(typeof nodecg.bundleConfig.user === 'undefined') {
        alert("If you want to use the twitch functionality, you need to create a file called nodecg-speedcontrol.json in nodecg/cfg and fill it with:\n" +
            "{\n"+
            "\"user\": \"username\"\n" +
            "}\n"+
            "exchange username with the twitch username which you want to access");
        return;
    }

    if($streamControlTitle.val() != "" && $streamControlGame.val() != "") {
        var methodString = "/channels/"+nodecg.bundleConfig.user+"/";
        Twitch.api({method: methodString, params: {
            "channel": {
                "status": $streamControlTitle.val(),
                "game":  $streamControlGame.val(),
                "delay": 0
            }
        },
            verb: 'PUT' }, function(resp, ans) {
        });
    }
    else {
        alert("Both fields must be filled in to make a valid submission to Twitch");
    }
});

$streamControlInit.click(function() {
    Twitch.login({
        scope: ['user_read', 'channel_editor']
    });
});

Twitch.init({clientId: 'lrt9h6mot5gaf9lk62sea8u38lomfrc'}, function(error, status) {
    if (status.authenticated) {
        // Already logged in, hide button
        $streamControlInit.button({disabled: true});
        $streamControlInit.text("Already logged into twitch");
        $streamControlSubmit.button({disabled: false});
    }
    else {
        console.log("Could not log in to twitch: ");
        console.log(status);
    }
});


