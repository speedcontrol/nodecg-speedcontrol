'use strict';
var {GraphQLClient} = require('graphql-request');
var nodecg = require('./utils/nodecg-api-context').get();

// Create the GraphQL client with the OAuth from the config.
var client = new GraphQLClient('https://api.twitch.tv/gql', {
	headers: {
		'Authorization': 'OAuth '+nodecg.bundleConfig.twitch.highlighting.gqlOAuth
	}
});

// Gets the OAuth user's ID. Calls back an error and the ID.
exports.getCurrentUserID = function(callback) {
	var query = `query() {
		currentUser {
			id
		}
	}`;
	
	client.request(query)
		.then(data => callback(null, data.currentUser.id))
		.catch(err => callback(err.response.status, null));
}

// Gets the time the OAuth user's stream was created at.
exports.getStreamCreatedTime = function(callback) {
	var query = `query() {
		currentUser {
			stream {
				createdAt
			}
		}
	}`;

	client.request(query)
		.then(data => callback(data.currentUser.stream.createdAt))
		.catch(err => callback(null));
}

// Gets the OAuth user's most recent past broadcast ID/recorded timestamp.
exports.getMostRecentBroadcastData = function(callback) {
	var query = `query($currentUserVideosFirst: Int, $currentUserVideosTypes: [BroadcastType!], $currentUserVideosSort: VideoSort) {
		currentUser {
			videos(first: $currentUserVideosFirst, types: $currentUserVideosTypes, sort: $currentUserVideosSort) {
				edges {
					node {
						id
						recordedAt
					}
				}
			}
		}
	}`;
	var variables = {
		currentUserVideosFirst: 1,
		currentUserVideosTypes: 'ARCHIVE',
		currentUserVideosSort: 'TIME'
	};

	client.request(query, variables)
		.then(data => {
			if (data.currentUser.videos.edges.length)
				callback(data.currentUser.videos.edges[0].node);
			else
				callback(null);
		})
		.catch(err => callback(null));
}

// Gets an ID of a game from the name, calls back the ID if it can be found.
exports.getGameID = function(name, callback) {
	var query = `query($gameName: String) {
		game(name: $gameName) {
			id
		}
	}`;
	var variables = {
		gameName: name
	};
	
	client.request(query, variables)
		.then(data => {
			if (data.game)
				callback(data.game.id)
			else
				callback(null);
		})
		.catch(err => callback(null));
}

// Make a highlight, calls back the ID of the highlight.
exports.createHighlight = function(videoID, start, end, title, gameID, callback) {
	var query = `mutation($createVideoHighlightInput: CreateVideoHighlightInput!) {
		createVideoHighlight(input: $createVideoHighlightInput) {
			highlight {
				id
			}
		}
	}`;
	var variables = {
		createVideoHighlightInput: {
			sourceVideoID: videoID,
			startOffsetSeconds: start,
			endOffsetSeconds: end,
			metadata: {
				title: title,
				game: gameID
			}
		}
	};

	client.request(query, variables)
		.then(data => {
			if (data && data.createVideoHighlight && data.createVideoHighlight.highlight)
				callback(data.createVideoHighlight.highlight.id);
			else
				callback(null);
		})
		.catch(err => callback(null));
}