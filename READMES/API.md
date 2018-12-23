# API Documentation

Below is a list of the ways you can interact with this bundle from within your own layout bundles. This documentation assumes you have knowledge about [NodeCG](https://nodecg.com/) bundle development.

It is suggested you add this bundle as to your `bundleDependencies` when making your NodeCG bundle, see [nodecg.bundleDependencies here
](https://nodecg.com/tutorial-5_manifest.html); `"nodecg-speedcontrol": "^1.0.0"` or similar should be added there.


**This bundle may contain more than what is documented on here. If it's not mentioned, assume it to be unsupported and that it may change in an update.**

## `runData` Object Structure

Example object:
```
{
	game: "WarioWare: Smooth Moves",
	gameTwitch: "",
	system: "Wii",
	region: "",
	release: "",
	category: "Any%",
	estimate: "00:53:00",
	estimateS: 3180,
	setupTime: "00:10:00",
	setupTimeS: 600,
	scheduled: "2018-07-26T09:29:00+02:00",
	scheduledS: 1532590140,
	teams: [
		{
			name: "",
			id: 0,
			players: [
				{
					name: "ChriSoofy",
					id: 0,
					teamID: 0,
					country: "de",
					social: {
						twitch: "chrisoofy"
					}
				}
			]
		},
		{
			name: "",
			id: 1,
			players: [
				{
					name: "Ellaapiie",
					id: 1,
					teamID: 1,
					country: "nl",
					social: {
						twitch: "ellaapiie"
					}
				}
			]
		}
	],
	customData: {},
	teamLastID: 1,
	playerLastID: 1,
	id: 81
}
```

(document the structure here)


## Replicants

#### `> nodecg.Replicant('runDataArray', 'nodecg-speedcontrol')`

An array of `runData` objects (see above) of all of the runs that have been imported/added. This is the same thing that is used in the *Run Player*/*Run Editor* panels, and any reordering done in the *Run Editor* panel is also reflected here.

#### `> nodecg.Replicant('runDataActiveRun', 'nodecg-speedcontrol')`

Either `undefined` if none is set, or a `runData` object (see above) of the currently active run as set by the *Run Player* panel.

#### `> nodecg.Replicant('timer', 'nodecg-speedcontrol')`

An object with data on the current status of the timer, updated every 100ms.

The default object state:
```
{
	time: '00:00:00',
	state: 'stopped',
	milliseconds: 0,
	timestamp: 0,
	teamFinishTimes: {}
}
```

- `time` is the current human readable time it is at (same as printed on the *Run Timer* panel).
- `state` is the current state; can be `stopped` (timer is at 0), `running` (timer is currently running), `paused` (timer was running but has been paused) or `finished` (timer has been ended and is showing the final time).
- `milliseconds` is the current time, but in milliseconds for calculations.
- `timestamp` is a `Date.now()` timestamp of when the run was started.
- `teamFinishTimes` is a keyed object for the time a team has finished, if this run was a race. The key is the teams ID; the value is a copy of the `timer` replicant at the time (minus the `teamFinishTimes` value).


## Messages Sent

#### `> nodecg.listenFor('twitchAdStarted', 'nodecg-speedcontrol', callback)`

Emitted when a Twitch ad is successfully started via this bundle. Calls back with an object that contains `duration` which is an integer on how long the ads will run for.


## Messages Received

#### `> nodecg.sendMessageToBundle('playTwitchAd', 'nodecg-speedcontrol', callback)`

Used to tell the Twitch API to run ads if applicable to your channel and you have the Twitch API integration enabled. Calls back with `error, data` format, data is an object that contains `duration` which is an integer on how long the ads will run for if successful.