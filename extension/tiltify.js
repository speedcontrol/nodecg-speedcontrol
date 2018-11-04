'use strict';
var needle = require('needle');
var nodecg = require('./utils/nodecg-api-context').get();

var requestOptions = {
	headers: {
		'Authorization': ''
	}
};

if (nodecg.bundleConfig && nodecg.bundleConfig.tiltify && nodecg.bundleConfig.tiltify.enable) {
	if (!nodecg.bundleConfig.tiltify.token)
		nodecg.log.warn('Tiltify support is enabled but no API access token is set.');
	if (!nodecg.bundleConfig.tiltify.campaign)
		nodecg.log.warn('Tiltify support is enabled but no campaign ID is set.');
	
	if (!nodecg.bundleConfig.tiltify.token || !nodecg.bundleConfig.tiltify.campaign)
		return;
	
	nodecg.log.info('Tiltify integration is enabled.');
	var donationTotal = nodecg.Replicant('tiltifyDonationTotal', {persistent:false, defaultValue:0});
	requestOptions.headers['Authorization'] = 'Bearer '+nodecg.bundleConfig.tiltify.token;
	
	// Do the initial request, which also checks if the key is valid.
	needle.get('https://tiltify.com/api/v3/campaigns/'+nodecg.bundleConfig.tiltify.campaign, requestOptions, (err, resp) => {
		if (resp.statusCode === 403) {
			nodecg.log.warn('Your Tiltify API access token is not valid.');
			return;
		}

		if (resp.statusCode === 404) {
			nodecg.log.warn('The Tiltify campaign with the specified ID cannot be found.');
			return;
		}
		
		getDonationTotal(resp.body.data);
		setInterval(getUpdates, 30000); // Checks every 30 seconds.
	});
}

function getUpdates() {
	needle.get('https://tiltify.com/api/v3/campaigns/'+nodecg.bundleConfig.tiltify.campaign, requestOptions, (err, resp) => {
		if (!err && resp.statusCode === 200)
			getDonationTotal(resp.body.data);
	});
}

function getDonationTotal(data) {
	// Update the donation total replicant if it has actually changed.
	if (donationTotal.value !== data.amountRaised)
		donationTotal.value = data.amountRaised;
}