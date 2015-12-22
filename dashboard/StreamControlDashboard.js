'use strict';
var $streamControlTitle = $('#streamControlTitle');
var $streamControlGame = $('#streamControlGame');
var $streamControlSubmit = $('#streamControlSubmit');
var $streamControlInit = $('#streamControlInit');
var $enableTwitchSynchronizationRadios = $('#enableTwitchSynchronization');
var $enableTwitchSynchronizationRadio = $('input[name=enableTwitchSynchronizationRadio]');

var streamControlConfigurationReplicant = nodecg.Replicant('streamControlConfiguration');
streamControlConfigurationReplicant.on('change', function(oldVal, newVal) {
});

$enableTwitchSynchronizationRadios.buttonset();
$streamControlSubmit.button({disabled: true});
$streamControlInit.button();

$enableTwitchSynchronizationRadio.change(function() {
    var configuration = getOrCreateStreamControlConfiguration();
    configuration.synchronizeAutomatically = $(this).val() == "On";
    streamControlConfigurationReplicant.value = configuration;
});

function getOrCreateStreamControlConfiguration() {
    var configuration = streamControlConfigurationReplicant.value;
    if(typeof configuration !== 'undefined') {
        return configuration;
    }
    else {
        return createStreamControlConfiguration();
    }
}

function createStreamControlConfiguration() {
    var configuration = {};
    configuration.synchronizeAutomatically = false;
    return configuration;
}

$streamControlSubmit.click(function() {
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


Twitch.init({clientId: 'lrt9h6mot5gaf9lk62sea8u38lomfrc'}, function(error, status) {
    if (status.authenticated) {
        // Already logged in, hide button
        $streamControlInit.button({disabled: true});
        $streamControlSubmit.button({disabled: false});
    }
});
