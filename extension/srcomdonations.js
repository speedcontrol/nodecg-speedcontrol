// World's best README, available here:
// Refreshes info from API every 30 seconds.
// Replicants:
//   > srcomDonationTotal - current donation total as a float
//   > srcomDonationGoals - array of open goals (excluding bidwar related goals)
//   > srcomDonationBidwars - array of open bidwars (with embedded goals)
// Messages:
//   > srcomNewDonation - donation object (with embedded user/goal/bidwar)
// STILL TO BE ADDED: Prizes (I have no clue how this works yet because no examples)

'use strict';
var needle = require('needle');
var async = require('async');
var _ = require('lodash');

module.exports = function(nodecg) {
	var requestOptions = {
		follow: 1,
		headers: {
			'User-Agent': 'nodecg-speedcontrol'
		}
	};
	var eventID;
	var previousDonationIDs = [];
	var initDonations = false;
	
	if (typeof nodecg.bundleConfig !== 'undefined' && nodecg.bundleConfig.enableSRCDonations
		&& nodecg.bundleConfig.SRCEventSlug) {
		nodecg.log.info('"enableSRCDonations" is true, Speedrun.com Donation integration is enabled');
		
		// Setting up replicants.
		var srcomDonationTotalReplicant = nodecg.Replicant('srcomDonationTotal', {persistent:false, defaultValue:0});
		var srcomDonationGoalsReplicant = nodecg.Replicant('srcomDonationGoals', {persistent:false, defaultValue:[]});
		var srcomDonationBidwarsReplicant = nodecg.Replicant('srcomDonationBidwars', {persistent:false, defaultValue:[]});
		
		var url = 'https://www.speedrun.com/api/v1/games/'+nodecg.bundleConfig.SRCEventSlug.toLowerCase();
		needle.get(url, requestOptions, function(err, response) {
			// Checks to see if the slug exists on the site.
			if (!err && response.statusCode === 200) {
				// Gets the speedrun.com ID of the event.
				eventID = response.body.data.id;
				
				// Loops through the information links to see if this event is donations enabled.
				var links = response.body.data.links;
				var donationsActive = false;
				for (var i = 0; i < links.length; i++) {
					if (links[i].rel === 'donation-summary') {
						donationsActive = true; break;
					}
				}
				
				if (donationsActive)
					runFrequentUpdates();
				
				else nodecg.log.warn('The SRCEventSlug doesn\'t have donations enabled on Speedrun.com!');
			}
			
			else nodecg.log.warn('The SRCEventSlug does not exist on Speedrun.com!');
		});
	}
	
	else nodecg.log.info('"enableSRCDonations" is false (or you forgot the SRCEventSlug), Speedrun.com Donation integration is disabled');
	
	function runFrequentUpdates() {
		var newDonations, donationTotal, goals, bidwars;
		
		async.waterfall([
			function(asyncCallback) {
				checkDonationTotal(function(total) {donationTotal = total; asyncCallback();});
			},
			function(asyncCallback) {
				getNewDonations(function(donations) {newDonations = donations; asyncCallback();});
			},
			function(asyncCallback) {
				getGoals(function(updatedGoals) {goals = updatedGoals; asyncCallback();});
			},
			function(asyncCallback) {
				getBidwars(function(updatedBidwars) {bidwars = updatedBidwars; asyncCallback();});
			}
		], function(err) {
			// Update the total replicant if the donation total has actually changed.
			if (srcomDonationTotalReplicant.value !== donationTotal)
				srcomDonationTotalReplicant.value = donationTotal;
			
			// If there's any new donations, sends a message for each.
			if (newDonations.length > 0) {
				newDonations.forEach(function(donation) {
					nodecg.sendMessage('srcomNewDonation', donation);
				});
			}
			
			// Update goals/bidwars replicants.
			srcomDonationGoalsReplicant.value = goals;
			srcomDonationBidwarsReplicant.value = bidwars;
			
			setTimeout(runFrequentUpdates, 30000);
		});
	}
	
	// Used to frequently get the current donation total.
	function checkDonationTotal(callback) {
		var url = 'https://www.speedrun.com/api/v1/games/'+eventID+'/donations'
		needle.get(url, requestOptions, function(err, response) {
			// Divided by 100 because the API returns the total in cents.
			var donationTotal = response.body.data['total-donated']/100;
			callback(donationTotal);
		});
	}
	
	function getNewDonations(callback) {
		var currentDonationIDs = [];
		var currentDonationList = [];
		var url = 'https://www.speedrun.com/api/v1/games/'+eventID+'/donations/list?max=200&embed=user,goal,bidwar';
		async.whilst(
			function() {return url;},
			function(asyncCallback) {
				needle.get(url, requestOptions, function(err, response) {
					response.body.data.forEach(function(donation) {
						// We have no reason to store non-accepted donations.
						// We also need to only show them when they *are* accepted.
						if (donation.status === 'accepted') {
							currentDonationIDs.push(donation.id);
							currentDonationList.push(donation);
						}
					});
					
					url = undefined;
					response.body.pagination.links.forEach(function(link) {
						if (link.rel === 'next')
							url = link.uri;
					});
					asyncCallback();
				});
			},
			function(err) {
				var newDonations = [];
				
				if (initDonations) {
					var newDonationIDs = _.difference(currentDonationIDs, previousDonationIDs);
					
					// We have new donations to push.
					if (newDonationIDs.length > 0) {
						newDonationIDs.forEach(function(id) {
							newDonations.push(_.find(currentDonationList, {'id':id}));
						});
					}
				}
				
				previousDonationIDs = currentDonationIDs.slice(0);
				if (!initDonations) initDonations = true;
				callback(newDonations);
			}
		);
	}
	
	function getGoals(callback) {
		var goals = [];
		var url = 'https://www.speedrun.com/api/v1/games/'+eventID+'/donations/goals?max=200&embed=bidwar';
		async.whilst(
			function() {return url;},
			function(asyncCallback) {
				needle.get(url, requestOptions, function(err, response) {
					response.body.data.forEach(function(goal) {
						// We are ignoring goals related to bidwars for this bit.
						if (!goal.bidwar && goal.status === 'open')
							goals.push(goal);
					});
					
					url = undefined;
					response.body.pagination.links.forEach(function(link) {
						if (link.rel === 'next')
							url = link.uri;
					});
					asyncCallback();
				});
			},
			function(err) {
				callback(goals);
			}
		);
	}
	
	function getBidwars(callback) {
		var bidwars = [];
		var url = 'https://www.speedrun.com/api/v1/games/'+eventID+'/donations/bidwars?max=200&embed=goals';
		async.whilst(
			function() {return url;},
			function(asyncCallback) {
				needle.get(url, requestOptions, function(err, response) {
					response.body.data.forEach(function(bidwar) {
						if (bidwar.status === 'open')
							bidwars.push(bidwar);
					});
					
					url = undefined;
					response.body.pagination.links.forEach(function(link) {
						if (link.rel === 'next')
							url = link.uri;
					});
					asyncCallback();
				});
			},
			function(err) {
				callback(bidwars);
			}
		);
	}
}