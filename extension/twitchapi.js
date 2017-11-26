'use strict';
var needle = require('needle');
var async = require('async');
const express = require('express');
const app = express();
var channelInfoTimeout;

module.exports = function(nodecg) {
	// Default Twitch request options needed.
	var requestOptions = {
		headers: {
			'Accept': 'application/vnd.twitchtv.v5+json',
			'Content-Type': 'application/json'
		}
	};
	
	// Setting up replicants.
	var accessToken = nodecg.Replicant('twitchAccessToken');
	var refreshToken = nodecg.Replicant('twitchRefreshToken');
	var twitchChannelInfo = nodecg.Replicant('twitchChannelInfo');
	var twitchChannelID = nodecg.Replicant('twitchChannelID');
	var twitchChannelName = nodecg.Replicant('twitchChannelName');
	
	if (nodecg.bundleConfig && nodecg.bundleConfig.twitch && nodecg.bundleConfig.twitch.enabled) {
		nodecg.log.info('Twitch API integration is enabled.');
		
		requestOptions.headers['Client-ID'] = nodecg.bundleConfig.twitch.clientID;
		if (accessToken.value) requestOptions.headers['Authorization'] = 'OAuth '+accessToken.value;
		
		// If we have an access token already, check if it's still valid and refresh if needed.
		if (accessToken.value && accessToken.value !== '') {
			checkTokenValidity(() => {
				nodecg.listenFor('updateChannel', updateChannel);
				nodecg.listenFor('playTwitchAd', playTwitchAd);
				nodecg.listenFor('twitchGameSearch', gameSearch);
				
				requestOptions.headers['Authorization'] = 'OAuth '+accessToken.value;
				
				getCurrentChannelInfo();
			});
		}
		
		// Route that receives Twitch's auth code when the user does the flow from the dashboard.
		app.get('/nodecg-speedcontrol/twitchauth', (req, res) => {
			res.send('<b>Twitch authentication is now complete, feel free to close this window/tab.</b>');
			if (req.query.error) return;
			
			needle.post('https://api.twitch.tv/kraken/oauth2/token', {
				'client_id': nodecg.bundleConfig.twitch.clientID,
				'client_secret': nodecg.bundleConfig.twitch.clientSecret,
				'code': req.query.code,
				'grant_type': 'authorization_code',
				'redirect_uri': nodecg.bundleConfig.twitch.redirectURI
			}, (err, resp) => {
				accessToken.value = resp.body.access_token;
				refreshToken.value = resp.body.refresh_token;
				requestOptions.headers['Authorization'] = 'OAuth '+resp.body.access_token;
				
				needle.get('https://api.twitch.tv/kraken', requestOptions, (err, resp) => {
					// Get user ID from Twitch, because v5 requires this for everything.
					twitchChannelID.value = resp.body.token.user_id;
					twitchChannelName.value = resp.body.token.user_name;
					clearTimeout(channelInfoTimeout);
					getCurrentChannelInfo();
					
					// Setting up listeners.
					nodecg.listenFor('updateChannel', updateChannel);
					nodecg.listenFor('playTwitchAd', playTwitchAd);
					nodecg.listenFor('twitchGameSearch', gameSearch);
				});
			});
		});
		nodecg.mount(app);
	}
	
	// Having to do a check every time before using the API is sloppy, need to improve flow.
	function checkTokenValidity(callback) {
		needle.get('https://api.twitch.tv/kraken', requestOptions, (err, resp) => {
			// If the OAuth token is valid, we can use it for our requests!
			if (resp.body.token && resp.body.token.valid)
				if (callback) callback();
			else
				updateToken(() => {if (callback) callback();});
		});
	}
	
	function updateToken(callback) {
		needle.post('https://api.twitch.tv/kraken/oauth2/token', {
			'grant_type': 'refresh_token',
			'refresh_token': encodeURI(refreshToken.value),
			'client_id': nodecg.bundleConfig.twitch.clientID,
			'client_secret': nodecg.bundleConfig.twitch.clientSecret
		}, (err, resp) => {
			accessToken.value = resp.body.access_token;
			refreshToken.value = resp.body.refresh_token;
			requestOptions.headers['Authorization'] = 'OAuth '+resp.body.access_token;
			callback();
		});
	}
	
	// Used to frequently get the details of the channel for use on the dashboard.
	function getCurrentChannelInfo() {
		checkTokenValidity(() => {
			var url = 'https://api.twitch.tv/kraken/channels/'+twitchChannelID.value;
			needle.get(url, requestOptions, (err, resp) => {
				channelInfoTimeout = setTimeout(getCurrentChannelInfo, 60000);
				if (handleResponse(err, resp))
					twitchChannelInfo.value = resp.body;
			});
		});
	}
	
	function updateChannel(updatedValues) {
		checkTokenValidity(() => {
			var url = 'https://api.twitch.tv/kraken/channels/'+twitchChannelID.value;
			var data = {
				'channel': {
					'status': updatedValues.channel.status,
					'game': updatedValues.channel.game
				}
			};
			
			needle.put(url, data, requestOptions, (err, resp) => {
				if (handleResponse(err, resp)) {
					console.log('We Successfully updated the channel!');
					twitchChannelInfo.value = resp.body;
				}
			});
		});
	}
	
	function playTwitchAd() {
		checkTokenValidity(() => {
			var url = 'https://api.twitch.tv/kraken/channels/'+twitchChannelID.value+'/commercial';
			needle.post(url, {'duration':180}, requestOptions, (err, resp) => {
				console.log('Requested a Twitch ad');
				if (handleResponse(err, resp)) {
					console.log('Twitch ad started successfully');
					nodecg.sendMessage('twitchAdStarted');
				}
			});
		});
	}
	
	// use this by sending a nodecg.sendMessage('twitchGameSearch', QUERY, function(reply) {
	function gameSearch(searchQuery, callback) {
		var replyData = '';
		
		checkTokenValidity(() => {
			var url = 'https://api.twitch.tv/kraken/search/games?query='+encodeURI(searchQuery);
			needle.get(url, requestOptions, (err, resp) => {
				if (handleResponse(err, resp)) {
					// set the reply replicant with the first result
					if (resp.body.games && resp.body.games.length > 0) {
						replyData = resp.body.games[0].name;
						console.log("First result on twitch for \""+ searchQuery + "\" was \""+ replyData + "\"");
						} else {
						// return nothing if no results
						console.log("No matches on twitch for \""+ searchQuery +"\"");
					}
				}
				
				// Pass reply back to web browser
				callback(replyData);
			});
		});
	}
	
	// Prints error details to the console if needed.
	// true if no issues, false if there were any
	function handleResponse(err, resp) {
		if (err || resp.statusCode !== 200 || !resp || !resp.body) {
			console.log('Error occurred in communication with twitch, look below');
			console.log(err);
			if (resp && resp.body) console.log(resp.body);
			return false;
		}
		
		else return true;
	}
};