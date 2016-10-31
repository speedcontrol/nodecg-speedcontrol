'use strict';

var app = require('express')();
var TwitchAPI = require('twitch-api');
var twitch = '';
var request = require("request");
var nodeCgExport = ''
var accessToken ='';
var accessTokenReplicant;
var twitchChannelInfoReplicant;

module.exports = function (nodecg) {
    if (typeof nodecg.bundleConfig !== 'undefined' && nodecg.bundleConfig.enableTwitchApi) {
        nodecg.log.warn('"enableTwitchApi" is true, the twitch REST API will be active.');

        nodecg.listenFor('twitchLogin',twitch_Login);
        nodecg.listenFor('twitchLoginForwardCode',twitch_LoginForwardCode);
        nodecg.listenFor('updateChannel',twitch_updateChannel);
        nodecg.listenFor('playTwitchAd',playTwitchAd);
		accessTokenReplicant = nodecg.Replicant('twitchAccessToken', {persistent: false});
		twitchChannelInfoReplicant = nodecg.Replicant('twitchChannelInfo', {persistent: false});
		
		// Twitch search to and fro
		nodecg.listenFor('twitchGameSearch',twitch_GameSearch);

        app.get('/nodecg-speedcontrol/twitchlogin', function (req, res) {
            console.log("intercepted a message!");
            res.status(200);
        });

        twitch = new TwitchAPI({
            clientId: 'lrt9h6mot5gaf9lk62sea8u38lomfrc',
            clientSecret: 'fprpfvriz56tjly2m8o9zxdcvo5nvmi',
            redirectUri: 'http://localhost:9090/dashboard/',
            scopes: ['channel_editor','user_read','chat_login','channel_commercial']
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

function twitch_GameSearch(searchQuery, callback) {
	var replyData = '';

	// use this by sending a nodecg.sendMessage('twitchGameSearch', QUERY, function(reply) {
	twitch.searchGames({query: searchQuery, type:'suggest'}, function(err, body) {
		if (err){
             console.log("Error occurred in communication with twitch, look below");
             console.log(err);
		} else {
			// set the reply replicant with the first result
			if ((body.games[0] != undefined) && (body.games[0].name != null)) {
				replyData = body.games[0].name;
				console.log("First result on twitch for \""+ searchQuery + "\" was \""+ replyData + "\"");
				} else {
				// return nothing if no results
				replyData = '';
				console.log("No matches on twitch for \""+ searchQuery +"\"");
			}
		}
		// Pass reply back to web browser
		callback(replyData);
	})
}

function twitch_LoginForwardCode(code) {
     twitch.getAccessToken(code, function(err, body){
         if (err){
             console.log("Error occurred in communication with twitch, look below");
             console.log(err);

         } else {
             console.log("We are Authorized to update Twitch Channel!");
             accessToken = body.access_token;
			 accessTokenReplicant.value = accessToken;
             nodeCgExport.sendMessage("twitchLoginSuccessful");
			 getCurrentChannelInfo();
         }
     });
}

function twitch_updateChannel(updatedValues) {
    //console.log("user: " + nodeCgExport.bundleConfig.user + " accessToken: " + accessToken);
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
		twitchChannelInfoReplicant.value = body;
    }
}

// Used to frequently get the details of the channel for use on the dashboard.
function getCurrentChannelInfo() {
	twitch.getChannel(nodeCgExport.bundleConfig.user, function(err, body) {
		if (err) {
			console.log("Error occurred in communication with twitch, look below");
			console.log(err);
		}
		
		else {
			twitchChannelInfoReplicant.value = body;
		}
		
		setTimeout(getCurrentChannelInfo, 60000);
	});
}

function playTwitchAd() {
	twitch.startCommercial(nodeCgExport.bundleConfig.user, accessToken, {length: 60}, function(err) {
		if (err) {
			console.log("Error occurred in communication with twitch, look below");
			console.log(err);
		}
	});
}