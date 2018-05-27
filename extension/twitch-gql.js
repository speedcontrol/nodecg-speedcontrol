'use strict';
var {GraphQLClient} = require('graphql-request');
var nodecg = require('./utils/nodecg-api-context').get();

// Create the GraphQL client with the OAuth from the config.
var client = new GraphQLClient('https://api.twitch.tv/gql', {
	headers: {
		'Authorization': 'OAuth '+nodecg.bundleConfig.twitch.highlighting.gqlOAuth
	}
});

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

// Make a highlight, calls back the ID of the highlight.
// TODO: Add game ID
exports.createHighlight = function(ID, start, end, title, callback) {
	var query = `mutation($createVideoHighlightInput: CreateVideoHighlightInput!) {
		createVideoHighlight(input: $createVideoHighlightInput) {
			highlight {
				id
			}
		}
	}`;
	var variables = {
		createVideoHighlightInput: {
			sourceVideoID: ID,
			startOffsetSeconds: start,
			endOffsetSeconds: end,
			metadata: {
				title: title
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