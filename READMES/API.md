# API Documentation

**If you were developing bundles that relied on this bundle before v1.x was released, please check [Migrating from v0.9 to v1.x](Migrating-from-v0.9-to-v1.x.md).**

Below is a list of the ways you can interact with this bundle from within your own layout bundles. This documentation assumes you have knowledge about [NodeCG](https://nodecg.com/) bundle development.

It is suggested you add this bundle as to your `bundleDependencies` when making your NodeCG bundle, see [nodecg.bundleDependencies here](https://nodecg.com/tutorial-5_manifest.html); `"nodecg-speedcontrol": "^1.0.0"` or similar should be added there.


**This bundle may contain more than what is documented on here. If it's not mentioned, assume it to be unsupported and that it may change in an update.**

## `runData` Object Structure

Various places in this bundle store information in the format we refer to as a "`runData` object".

Example object:
```
{
	game: "WarioWare: Smooth Moves",
	gameTwitch: "WarioWare: Smooth Moves",
	system: "Wii",
	region: "PAL",
	release: "2006",
	category: "Any%",
	estimate: "00:53:00",
	estimateS: 3180,
	setupTime: "00:10:00",
	setupTimeS: 600,
	scheduled: "2018-07-26T09:29:00+02:00",
	scheduledS: 1532590140,
	teams: [
		{
			name: "Mario",
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
			name: "Luigi",
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
	customData: {
		gameShort: "Game (Short)"
	},
	id: 81
}
```

- `game` *String* The name of the game being ran.
- `gameTwitch` *String* The name of the game in the Twitch directory.
- `system` *String* The system/platform/console the run is being done on.
- `region` *String* Region the copy of the game is from.
- `release` *String* Stores information on when the game was released.
- `category` *String* Category that is being ran.
- `estimate` *String* Run estimate in a human readable string.
- `estimateS` *Integer* Same as above but in seconds.
- `setupTime` *String* Run setup time (to be added to the end of the run) in a human readable string.
- `setupTimeS` *Integer* Same as above but in seconds.
- `scheduled` *String* Timestamp for when the run is scheduled, with the timezone. Only applicable for runs imported from Horaro.
- `scheduledS` *Integer* Same as above but as a unix timestamp.
- `teams` *Array* Teams that are doing this run. Length can be 0 (no teams/players), 1 (single player run or co-op) or 2 or more (race and/or co-op race).
- `customData` *Object* Contains `key: "data"` information; key is from your configuration for custom data.
- `id` *Integer* Unique run ID in the currently set schedule of runs.

#### `teams` Array: `team` Object

The `teams` array will contain (if anything) "`team` objects".

- `name` *String* Custom name of the team, if one has been set.
- `id` *Integer* Unique team ID ***in this run only***.
- `players` *Array* Players in this team. Length could be 0 (but probably never), 1 (single player run or race, if there are more teams) or 2 or more (co-op and/or co-op race, if there are more teams).

#### `players` Array: `player` Object

The `players` array in "`team` objects" will contain (if anything) "`player` objects".

- `name` *String* Name of the player.
- `id` *Integer* Unique player ID ***in this run only***.
- `teamID` *Integer* ID of the team this player is on.
- `country` *String* country code of the country where this player is from, usually pulled from [speedrun.com](https://www.speedrun.com).
- `social` *Object* Contains information on this player's social media references.
  - `twitch` *String* Username of this player on [twitch.tv](https://www.twitch.tv).


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
	time: "00:00:00",
	state: "stopped",
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

An example of the object, during a race while the timer is still running but team with ID 1 has finished:
```
{
	time: "00:14:51",
	state: "running",
	milliseconds: 891053,
	timestamp: 1545591937067,
	teamFinishTimes: {
		1: {
			time: "00:14:37",
			state: "running",
			milliseconds: 877274,
			timestamp: 1545591923282
		}
	}
}
```


## Messages Sent

#### `> nodecg.listenFor('twitchAdStarted', 'nodecg-speedcontrol', callback)`

Emitted when a Twitch ad is successfully started via this bundle. Calls back with an object that contains `duration` which is an integer on how long the ads will run for.


## Messages Received

#### `> nodecg.sendMessageToBundle('playTwitchAd', 'nodecg-speedcontrol', callback)`

Used to tell the Twitch API to run ads if applicable to your channel and you have the Twitch API integration enabled. Calls back with `error, data` format, data is an object that contains `duration` which is an integer on how long the ads will run for if successful.


## Example Bundles

- [speedcontrol-simpletext](https://github.com/speedcontrol/speedcontrol-simpletext), our own simple example bundle.