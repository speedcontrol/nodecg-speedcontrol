'use strict';
var nodecg = require('./utils/nodecg-api-context').get();

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
	players: [],
	customData: {},
	teamNames: {},
	teamLastID: -1,
	runID: -1
}, persistent: false});

const defaultRunDataTeamObject = nodecg.Replicant('defaultRunDataTeamObject', {defaultValue: {
	ID: -1,
	members: []
}, persistent: false});

const defaultPlayerObject = nodecg.Replicant('defaultPlayerObject', {defaultValue: {
	name: '',
	teamID: -1,
	country: '',
	social: {
		twitch: ''
	}
}, persistent: false});