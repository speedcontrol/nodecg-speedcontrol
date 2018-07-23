'use strict';
var needle = require('needle');
var async = require('async');
const express = require('express');
const app = express();
var channelInfoTimeout;
var nodecg = require('./utils/nodecg-api-context').get();

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

if (nodecg.bundleConfig && nodecg.bundleConfig.twitch && nodecg.bundleConfig.twitch.enable) {
	nodecg.log.info('Twitch integration is enabled.');
	
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
			require('./twitch-highlighting');
			require('./twitch-gql');
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
				
				require('./twitch-highlighting');
				require('./twitch-gql');
			});
		});
	});
	nodecg.mount(app);
}

// Having to do a check every time before using the API is sloppy, need to improve flow.
function checkTokenValidity(callback) {
	//nodecg.log.info('Checking Twitch token validity...');
	var tokenChecked = false;
	async.whilst(
		() => {return !tokenChecked},
		(callback) => {
			needle.get('https://api.twitch.tv/kraken', requestOptions, (err, resp) => {
				if (err || resp.statusCode !== 200 || !resp || !resp.body) callback();
				else {
					tokenChecked = true;
					callback(null, resp.body);
				}
			});
		},
		(err, body) => {
			// If the OAuth token is valid, we can use it for our requests!
			if (body.token && body.token.valid) {
				//nodecg.log.info('Twitch token is valid.');
				if (callback) callback();
			}
			else
				updateToken(() => {if (callback) callback();});
		}
	);
}

function updateToken(callback) {
	nodecg.log.info('Twitch API token being refreshed...');
	var tokenRefreshed = false;
	async.whilst(
		() => {return !tokenRefreshed},
		(callback) => {
			needle.post('https://api.twitch.tv/kraken/oauth2/token', {
				'grant_type': 'refresh_token',
				'refresh_token': encodeURI(refreshToken.value),
				'client_id': nodecg.bundleConfig.twitch.clientID,
				'client_secret': nodecg.bundleConfig.twitch.clientSecret
			}, (err, resp) => {
				if (err || resp.statusCode !== 200 || !resp || !resp.body) callback();
				else {
					tokenRefreshed = true;
					callback(null, resp.body);
				}
			});
		},
		(err, body) => {
			accessToken.value = body.access_token;
			refreshToken.value = body.refresh_token;
			requestOptions.headers['Authorization'] = 'OAuth '+body.access_token;
			nodecg.log.info('Twitch API token successfully refreshed.');
			callback();
		}
	);
}

// Used to frequently get the details of the channel for use on the dashboard.
function getCurrentChannelInfo() {
	//nodecg.log.info('Trying to get channel information.');
	channelInfoTimeout = setTimeout(getCurrentChannelInfo, 60000); //outside of request so if that breaks this doesn't break, should be improved
	checkTokenValidity(() => {
		var url = 'https://api.twitch.tv/kraken/channels/'+twitchChannelID.value;
		needle.get(url, requestOptions, (err, resp) => {
			if (handleResponse(err, resp)) {
				//nodecg.log.info('Successfully got channel information.');
				twitchChannelInfo.value = resp.body;
			}
		});
	});
}

function updateChannel(updatedValues) {
	nodecg.log.info('Trying to update Twitch channel information.');
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
				nodecg.log.info('Successfully updated Twitch channel information.');
				twitchChannelInfo.value = resp.body;
			}
		});
	});
}

function playTwitchAd(data, callback) {
	checkTokenValidity(() => {
		var url = 'https://api.twitch.tv/kraken/channels/'+twitchChannelID.value+'/commercial';
		needle.post(url, {'duration':180}, requestOptions, (err, resp) => {
			nodecg.log.info('Requested a Twitch ad be played.');
			if (handleResponse(err, resp)) {
				nodecg.log.info('Twitch ad started successfully.');
				// nodecg.sendMessage('twitchAdStarted', {'duration':180});
				if (callback) callback({successful: true, result: {duration: 180}}); // Calls back successfully.
			}
			else
				if (callback) callback({successful: false, error: err}); // Call back with an error.
		});
	});
}

// use this by sending a nodecg.sendMessage('twitchGameSearch', QUERY, function(reply) {
function gameSearch(searchQuery, callback) {
	var replyData = '';
	
	nodecg.log.info('Trying to search for game name on Twitch: '+searchQuery);
	checkTokenValidity(() => {
		var url = 'https://api.twitch.tv/kraken/search/games?query='+encodeURI(searchQuery);
		needle.get(url, requestOptions, (err, resp) => {
			if (handleResponse(err, resp)) {
				// set the reply replicant with the first result
				if (resp.body.games && resp.body.games.length > 0) {
					replyData = resp.body.games[0].name;
					nodecg.log.info("First result on twitch for \""+ searchQuery + "\" was \""+ replyData + "\"");
					} else {
					// return nothing if no results
					nodecg.log.warn("No matches on twitch for \""+ searchQuery +"\"");
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
		nodecg.log.warn('Error occurred in communication with twitch, look below');
		nodecg.log.warn(err);
		if (resp && resp.body) nodecg.log.warn(JSON.stringify(resp.body));
		return false;
	}
	
	else return true;
}