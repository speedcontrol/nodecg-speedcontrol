'use strict';
var nodecg = require('./util/nodecg-api-context').get();
var customData = nodecg.bundleConfig.schedule.customData || [];

nodecg.Replicant('runDataLastID');

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
	id: -1
}, persistent: false});

// Add the custom data settings.
customData.forEach((customDataElem) => {
	if (customDataElem.key && customDataElem.name)
		defaultRunDataObject.value.customData[customDataElem.key] = '';
});

const defaultTeamObject = nodecg.Replicant('defaultTeamObject', {defaultValue: {
	name: '',
	id: -1,
	players: []
}, persistent: false});

const defaultPlayerObject = nodecg.Replicant('defaultPlayerObject', {defaultValue: {
	name: '',
	id: -1,
	teamID: -1,
	country: '',
	social: {
		twitch: ''
	}
}, persistent: false});