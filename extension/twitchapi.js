'use strict';

var app = require('express')();
var TwitchAPI = require('twitch-api');
var twitch = '';
var request = require("request");
var nodeCgExport = ''
var accessToken ='';

module.exports = function (nodecg) {
    if (typeof nodecg.bundleConfig !== 'undefined' && nodecg.bundleConfig.enableTwitchApi) {
        nodecg.log.warn('"enableTwitchApi" is true, the twitch REST API will be active.');

        nodecg.listenFor('twitchLogin',twitch_Login);
        nodecg.listenFor('twitchLoginForwardCode',twitch_LoginForwardCode);
        nodecg.listenFor('updateChannel',twitch_updateChannel);

        app.get('/nodecg-speedcontrol/twitchlogin', function (req, res) {
            console.log("intercepted a emssage!");
            res.status(200);
        });

        twitch = new TwitchAPI({
            clientId: 'lrt9h6mot5gaf9lk62sea8u38lomfrc',
            clientSecret: 'fprpfvriz56tjly2m8o9zxdcvo5nvmi',
            redirectUri: 'http://localhost:9090/dashboard/',
            scopes: ['channel_editor','user_read']
        });

        nodecg.mount(app);
        nodeCgExport = nodecg;
    } else {
        nodecg.log.info('"enableTwitchApi" is false, the Twitch REST API will be unavailable');
    }
};

function twitch_Login() {
    var URL = twitch.getAuthorizationUrl();
    nodeCgExport.sendMessage('twitchLoginAuthorization',URL);
}

function twitch_LoginForwardCode(code) {
     twitch.getAccessToken(code, function(err, body){
         if (err){
             console.log("Error occurred in communication with twitch, look below");
             console.log(err);

         } else {
             console.log("We are Authorized to update Twitch Channel!");
             accessToken = body.access_token;
             nodeCgExport.sendMessage("twitchLoginSuccessful");
         }
     });
}

function twitch_updateChannel(updatedValues) {
    console.log("user: " + nodeCgExport.bundleConfig.user + " accessToken: " + accessToken);
    twitch.updateChannel(nodeCgExport.bundleConfig.user, accessToken, {
        "channel": {
            "status": updatedValues.channel.status,
            "game":  updatedValues.channel.game,
        }
    }, twitch_updateChannelCallback);
}

function twitch_updateChannelCallback(err, body) {
    if (err){
        console.log("Error occurred in communication with twitch, look below");
        console.log(err);

    } else {
        console.log("We Successfully updated the channel!");
    }
}