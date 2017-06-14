'use strict';
var needle = require('needle');

module.exports = function(nodecg) {
	// Default Twitch request options needed.
	var requestOptions = {
		headers: {
			'Accept': 'application/vnd.twitchtv.v5+json',
			'Client-ID': 'lrt9h6mot5gaf9lk62sea8u38lomfrc',
			'Content-Type': 'application/json'
		}
	};
	
	if (typeof nodecg.bundleConfig !== 'undefined' && nodecg.bundleConfig.enableTwitchApi
		&& nodecg.bundleConfig.user && nodecg.bundleConfig.oauth) {
		nodecg.log.info('"enableTwitchApi" is true, the Twitch REST API will be active.');
		
		// Setting up replicants.
		var accessTokenReplicant = nodecg.Replicant('twitchAccessToken', {persistent: false});
		var twitchChannelInfoReplicant = nodecg.Replicant('twitchChannelInfo', {persistent: false});
		var twitchChannelIDReplicant = nodecg.Replicant('twitchChannelID', {persistent: false});
		
		// Setting up listeners.
		nodecg.listenFor('updateChannel', twitch_updateChannel);
		nodecg.listenFor('playTwitchAd', playTwitchAd);
		nodecg.listenFor('twitchGameSearch', twitch_GameSearch);
		
		// Store oauth and add to the request options.
		accessTokenReplicant.value = nodecg.bundleConfig.oauth;
		requestOptions.headers['Authorization'] = 'OAuth '+accessTokenReplicant.value;
		
		needle.get('https://api.twitch.tv/kraken', requestOptions, function(err, response) {
			// If the OAuth token is valid, we can use it for our requests!
			if (response.body.token && response.body.token.valid) {
				// Get user ID from Twitch, because v5 requires this for everything.
				twitchChannelIDReplicant.value = response.body.token['user_id'];
			}
			
			else nodecg.log.warn('Your Twitch OAuth is not valid!');
			
			getCurrentChannelInfo();
		});
	}
	
	else nodecg.log.info('"enableTwitchApi" is false (or you forgot user/oauth), the Twitch REST API will be unavailable');
	
	// Used to frequently get the details of the channel for use on the dashboard.
	function getCurrentChannelInfo() {
		var url = 'https://api.twitch.tv/kraken/channels/'+twitchChannelIDReplicant.value;
		needle.get(url, requestOptions, function(err, response) {
			if (handleResponse(err, response))
				twitchChannelInfoReplicant.value = response.body;
			
			setTimeout(getCurrentChannelInfo, 60000);
		});
	}
	
	function twitch_updateChannel(updatedValues) {
		var url = 'https://api.twitch.tv/kraken/channels/'+twitchChannelIDReplicant.value;
		var data = {
			'channel': {
				'status': updatedValues.channel.status,
				'game': updatedValues.channel.game
			}
		};
		
		needle.put(url, data, requestOptions, function(err, response) {
			if (handleResponse(err, response)) {
				console.log('We Successfully updated the channel!');
				twitchChannelInfoReplicant.value = response.body;
			}
		});
	}
	
	function playTwitchAd() {
		var url = 'https://api.twitch.tv/kraken/channels/'+twitchChannelIDReplicant.value+'/commercial';
		needle.post(url, {'duration':180}, requestOptions, function(err, response) {
			handleResponse(err, response) // done
		});
	}
	
	// use this by sending a nodecg.sendMessage('twitchGameSearch', QUERY, function(reply) {
	function twitch_GameSearch(searchQuery, callback) {
		var replyData = '';
		
		var url = 'https://api.twitch.tv/kraken/search/games?query='+encodeURI(searchQuery);
		needle.get(url, requestOptions, function(err, response) {
			if (handleResponse(err, response)) {
				// set the reply replicant with the first result
				if (response.body.games && response.body.games.length > 0) {
					replyData = response.body.games[0].name;
					console.log("First result on twitch for \""+ searchQuery + "\" was \""+ replyData + "\"");
					} else {
					// return nothing if no results
					console.log("No matches on twitch for \""+ searchQuery +"\"");
				}
			}
			
			// Pass reply back to web browser
			callback(replyData);
		});
	}
	
	// Prints error details to the console if needed.
	// true if no issues, false if there were any
	function handleResponse(err, response) {
		if (err || response.statusCode !== 200) {
			console.log('Error occurred in communication with twitch, look below');
			console.log(err);
			console.log(response.body);
			return false;
		}
		
		else return true;
	}
};