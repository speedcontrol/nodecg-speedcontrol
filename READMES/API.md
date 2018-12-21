# API Documentation

Below is a list of the ways you can interact with this bundle from within your own layout bundles. This documentation assumes you have knowledge about [NodeCG](https://nodecg.com/) bundle development.

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

#### `> nodecg.Replicant('stopwatch', 'nodecg-speedcontrol')`

An object with data on the current status of the stopwatch/timer, updated every 100ms.

The default object state:
```
{
	time: '00:00:00',
	state: 'stopped',
	milliseconds: 0,
	timestamp: 0
}
```

- `time` is the current human readable time it is at (same as printed on the *Run Timer* panel).
- `state` is the current state; can be `stopped` (timer is at 0), `running` (timer is currently running), `paused` (timer was running but has been paused) or `finished` (timer has been ended and is showing the final time).
- `milliseconds` is the current time, but in milliseconds for calculations.
- `timestamp` is a `Date.now()` timestamp of when the run was started.


## Messages Sent

#### `> nodecg.listenFor('twitchAdStarted', 'nodecg-speedcontrol', callback)`

Emitted when a Twitch ad is successfully started via this bundle. Calls back with an object that contains `duration` which is an integer on how long the ads will run for.

#### `> nodecg.listenFor('resetTime', 'nodecg-speedcontrol', callback)`

Emitted when the stopwatch/timer is reset, mainly useful for removing finshing times of teams from a layout.

#### `> nodecg.listenFor('teamFinish', 'nodecg-speedcontrol', callback)`

Emitted when a team finishes in a run, only useful if the run is a race and you want to show what time they finished on your layouts. Calls back with an integer which is the index of the team in the current run.

#### `> nodecg.listenFor('teamUndoFinish', 'nodecg-speedcontrol', callback)`

Emitted when a teams finish state is undone, in case their finish was accidental, mainly useful for removing that time from the layout if you used the above message to print it. Calls back with an integer which is the index of the team in the current run.


## Messages Received

#### `> nodecg.sendMessageToBundle('playTwitchAd', 'nodecg-speedcontrol', callback)`

Used to tell the Twitch API to run ads if applicable to your channel and you have the Twitch API integration enabled. Calls back with `error, data` format, data is an object that contains `duration` which is an integer on how long the ads will run for if successful.