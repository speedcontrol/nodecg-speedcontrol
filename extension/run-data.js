'use strict';
var nodecg = require('./utils/nodecg-api-context').get();
var customData = nodecg.bundleConfig.schedule.customData || [];

var runDataLastID = nodecg.Replicant('runDataLastID', {defaultValue: -1});

const defaultRunDataObject = nodecg.Replicant('defaultRunDataObject', {defaultValue: {
	game: '',
	gameTwitch: '',
	system: '',
	region: '',
	release: '',
	category: '',
	estimate: '',
	estimateS: -1,
	setupTime: '',
	setupTimeS: -1,
	scheduled: '',
	scheduledS: -1,
	teams: [],
	customData: {},
	teamLastID: -1,
	playerLastID: -1,
	runID: -1
}, persistent: false});

// Add the custom data settings.
customData.forEach((customDataElem) => {
	if (customDataElem.key && customDataElem.name)
		defaultRunDataObject.value.customData[customDataElem.key] = '';
});

const defaultRunDataTeamObject = nodecg.Replicant('defaultRunDataTeamObject', {defaultValue: {
	name: '',
	ID: -1,
	players: []
}, persistent: false});

const defaultPlayerObject = nodecg.Replicant('defaultPlayerObject', {defaultValue: {
	name: '',
	ID: -1,
	teamID: -1,
	country: '',
	social: {
		twitch: ''
	}
}, persistent: false});