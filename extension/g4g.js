// This is currently using an undocumented API, so might break at any point.

'use strict';

var request = require('request');

var statsAPI = 'https://funds-api.gamingforgood.net/d/stats/fund/';
var donationsAPI = 'https://funds-api.gamingforgood.net/d/donations/fund/';  // not used in this code yet
var twitchChannelID;
var g4gDonationTotalReplicant;

module.exports = function(nodecg) {
	// Used to store whatever the API says is the current donation total is.
	g4gDonationTotalReplicant = nodecg.Replicant('g4gDonationTotal', {persistent: false, defaultValue: '0.00'});
	
	// Waits until we have the Twitch channel info before doing anything.
	var twitchChannelInfoReplicant = nodecg.Replicant('twitchChannelInfo', {persistent: false});
	twitchChannelInfoReplicant.on('change', function(oldValue, newValue) {
		if (!oldValue && newValue) {
			twitchChannelID = newValue['_id'];
			checkDonationTotal();
		}
	});
	
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
			console.log("Error occurred when requesting donation total from G4G.");
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