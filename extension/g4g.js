// This is currently using an undocumented API, so might break at any point.

'use strict';

var request = require('request');

var statsAPI = 'https://api.gamingforgood.net/d/stats/fund/';
var donationsAPI = 'https://api.gamingforgood.net/d/donations/fund/';  // not used in this code yet
var twitchChannelID;
var g4gDonationTotalReplicant;
var nodecg = require('./utils/nodecg-api-context').get();

if (nodecg.bundleConfig && nodecg.bundleConfig.gaming4Good && nodecg.bundleConfig.gaming4Good.enable) {
	// Will not enable if we have no way to get the Twitch channel ID.
	if (!nodecg.bundleConfig.gaming4Good.twitchChannelID || (nodecg.bundleConfig.twitch && !nodecg.bundleConfig.twitch.enable))
		nodecg.log.info("Gaming4Good integration was enabled but we have no way to know the Twitch channel.");
	
	nodecg.log.info("Gaming4Good integration is enabled.");
	
	// Used to store whatever the API says is the current donation total is.
	g4gDonationTotalReplicant = nodecg.Replicant('g4gDonationTotal', {persistent: false, defaultValue: '0.00'});
	
	// If a Twitch channel ID is specified manually in the config, use that instead.
	// This is in case the user doesn't use the Twitch integration but still wants to use Gaming4Good.
	if (nodecg.bundleConfig.gaming4Good.twitchChannelID) {
		twitchChannelID = nodecg.bundleConfig.gaming4Good.twitchChannelID;
		checkDonationTotal();
	}
	else {
		// Waits until we have the Twitch channel info before doing anything.
		var twitchChannelInfo = nodecg.Replicant('twitchChannelInfo', {persistent: false});
		twitchChannelInfo.on('change', (newVal, oldVal) => {
			if (!oldVal && newVal) {
				twitchChannelID = newValue['_id'];
				checkDonationTotal();
			}
		});
	}
}

// Used to frequently get the current donation total from G4G and if it's changed, update the replicant.
function checkDonationTotal() {
	request(createRequestOptions(statsAPI + twitchChannelID), function(error, response, body) {
		var parsed; if (!error) {try {parsed = JSON.parse(body);} catch(e) {parsed = null;}}

		if (parsed && !error && response.statusCode == 200) {
			// If the donation total exists and has changed, update the replicant.
			if (parsed['raisedCharity'] && g4gDonationTotalReplicant.value != parsed['raisedCharity']) {
				g4gDonationTotalReplicant.value = parsed['raisedCharity'];
			}
		}

		else {
			nodecg.log.warn("Error occurred when requesting donation total from Gaming4Good.");
		}

		setTimeout(checkDonationTotal, 30000);
	});
}

// Used to create the options for the API requests above, which includes the referer.
function createRequestOptions(apiURL) {
	return {
		url: apiURL,
		headers: {
			'Referer': 'https://www.gamingforgood.net'
		}
	}
}