'use strict';
var {GraphQLClient} = require('graphql-request');
var nodecg = require('./utils/nodecg-api-context').get();
var twitchChannelID = nodecg.Replicant('twitchChannelID');

// Create the GraphQL client with the OAuth from the config.
var client = new GraphQLClient('https://api.twitch.tv/gql', {
	headers: {
		'Authorization': 'OAuth '+nodecg.bundleConfig.twitch.highlighting.gqlOAuth,
		'Client-ID': nodecg.bundleConfig.twitch.clientID
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

// Gets the time the stored user's stream was created at, along with the ID of it.
exports.getStreamInfo = function(callback) {
	var query = `query($userId: ID, $userLogin: String) {
		user(id: $userId, login: $userLogin) {
			stream {
				createdAt
				id
			}
		}
	}`;
	var variables = {
		userId: twitchChannelID.value.toString()
	};

	client.request(query, variables)
		.then(data => callback(false, data.user.stream.createdAt, data.user.stream.id))
		.catch(err => callback(true));
}

// Gets the stored user's most recent past broadcast ID/recorded timestamp.
exports.getMostRecentBroadcastData = function(callback) {
	var query = `query($userId: ID, $userLogin: String, $userVideosFirst: Int, $userVideosTypes: [BroadcastType!], $userVideosSort: VideoSort) {
		user(id: $userId, login: $userLogin) {
			videos(first: $userVideosFirst, types: $userVideosTypes, sort: $userVideosSort) {
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
		userId: twitchChannelID.value.toString(),
		userVideosFirst: 1,
		userVideosTypes: 'ARCHIVE',
		userVideosSort: 'TIME'
	};

	client.request(query, variables)
		.then(data => {
			if (data.user.videos.edges.length)
				callback(data.user.videos.edges[0].node);
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

// Creates a bookmark at the current moment in time, calls back the ID of the bookmark.
exports.createBookmark = function(streamID, desc, callback) {
	var query = `mutation($createVideoBookmarkInput: CreateVideoBookmarkInput!) {
		createVideoBookmark(input: $createVideoBookmarkInput) {
			videoBookmark {
				id
			}
		}
	}`;
	var variables = {
		createVideoBookmarkInput: {
			broadcastID: streamID.toString(),
			description: desc,
			medium: 'chat',
			platform: 'web'
		}
	};

	client.request(query, variables)
		.then(data => {
			if (data && data.createVideoBookmark && data.createVideoBookmark.videoBookmark)
				callback(data.createVideoBookmark.videoBookmark.id);
			else
				callback(null);
		})
		.catch(err => callback(null));
}