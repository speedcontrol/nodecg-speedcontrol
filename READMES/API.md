# API Documentation

Below is a list of the ways you can interact with this bundle from within your own layout bundles. This documentation assumes you have knowledge about [NodeCG](https://nodecg.com/) bundle development.

It is suggested you add this bundle as to your `bundleDependencies` when making your NodeCG bundle, see [nodecg.bundleDependencies here](https://nodecg.com/tutorial-5_manifest.html); `"nodecg-speedcontrol": "^2.0.0"` or similar should be added there.

**This bundle may contain more than what is documented on here. If it's not mentioned, assume it to be unsupported and that it may change in an update.**


## `runData` Object Structure

Various places in this bundle store information in the format we refer to as a "`runData` object".

Example object:
```javascript
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
      id: "f926048c-3527-4d2f-96f6-680b81bf06e6",
      players: [
        {
          name: "ChriSoofy",
          id: "26a6dc65-7f39-4f33-a263-56be74bed783",
          teamID: "f926048c-3527-4d2f-96f6-680b81bf06e6",
          country: "de",
          social: {
            twitch: "chrisoofy"
          }
        }
      ]
    },
    {
      name: "Luigi",
      id: "18341eb2-eb45-4184-98f6-e74baafaf71a",
      players: [
        {
          name: "Ellaapiie",
          id: "5faa92a1-c3d2-4f4b-8d40-ce5c2ea7a67e",
          teamID: "18341eb2-eb45-4184-98f6-e74baafaf71a",
          country: "nl",
          social: {
            twitch: "ellaapiie"
          }
        }
      ]
    }
  ],
  customData: {
    gameShort: "WW Smooth Moves"
  },
  id: "f926048c-3527-4d2f-96f6-680b81bf06e6"
}
```

***Note that any of the values below can be undefined, unless specifically mentioned.***

- `game` *String* The name of the game being ran.
- `gameTwitch` *String* The name of the game in the Twitch directory.
- `system` *String* The system/platform/console the run is being done on.
- `region` *String* Region the copy of the game is from.
- `release` *String* Stores information on when the game was released.
- `category` *String* Category that is being ran.
- `estimate` *String* Run estimate in a human readable string.
- `estimateS` *Number* Same as above but in seconds.
- `setupTime` *String* Run setup time (to be added to the end of the run) in a human readable string.
- `setupTimeS` *Number* Same as above but in seconds.
- `scheduled` *String* Timestamp for when the run is scheduled, with the timezone. Only applicable for runs imported from Horaro.
- `scheduledS` *Number* Same as above but as a unix timestamp.
- `teams` *Array* Teams that are doing this run. Length can be 0 (no teams/players), 1 (single player run or co-op) or 2 or more (race and/or co-op race). This will always be an array even if no teams are contained within it.
- `customData` *Object* Contains `key: "data"` information; key is from your configuration for custom data, this will always be an object even if no data is contained within it.
- `id` *String* Unique ID, will always be set.

#### `teams` Array: `team` Object

The `teams` array will contain (if anything) "`team` objects".

- `name` *String* Custom name of the team, if one has been set.
- `id` *String* Unique ID.
- `players` *Array* Players in this team. Length could be 0 (but probably never), 1 (single player run or race, if there are more teams) or 2 or more (co-op and/or co-op race, if there are more teams).

#### `players` Array: `player` Object

The `players` array in "`team` objects" will contain (if anything) "`player` objects".

- `name` *String* Name of the player.
- `id` *String* Unique player ID.
- `teamID` *String* Unique ID of the team this player is on.
- `country` *String* country code of the country where this player is from, usually pulled from [speedrun.com](https://www.speedrun.com).
- `social` *Object* Contains information on this player's social media references.
  - `twitch` *String* Username of this player on [twitch.tv](https://www.twitch.tv).


## Replicants
([NodeCG documentation reference](https://nodecg.com/NodeCG.html#Replicant))

#### `runDataArray`

*Types available in [./types/RunData.d.ts](../types/RunData.d.ts)*

****Example code:****
```javascript
const runDataArray = nodecg.Replicant('runDataArray', 'nodecg-speedcontrol');
runDataArray.on('change', (newVal, oldVal) => {
  console.log(newVal);
  console.log(oldVal);
});
```
**Supplied data example:** *see above under "`runData` Object Structure"*

An array of `runData` objects (see above) of all of the runs that have been imported/added. This is the same thing that is used in the *Run Player*/*Run Editor* panels, and any reordering done in the *Run Editor* panel is also reflected here. This can be an empty array if there are no runs defined.

#### `runDataActiveRun`

*Types available in [./types/RunData.d.ts](../types/RunData.d.ts)*

****Example code:****
```javascript
const runDataActiveRun = nodecg.Replicant('runDataActiveRun', 'nodecg-speedcontrol');
runDataActiveRun.on('change', (newVal, oldVal) => {
  console.log(newVal);
  console.log(oldVal);
});
```
**Supplied data example:** *see above under "`runData` Object Structure"*

Either `undefined` if none is set, or a `runData` object (see above) of the currently active run as set by the *Run Player* panel (or similar).

#### `timer`

*Types available in [./types/Timer.d.ts](../types/Timer.d.ts)*

**Example code:**
```javascript
const timer = nodecg.Replicant('timer', 'nodecg-speedcontrol');
timer.on('change', (newVal, oldVal) => {
  console.log(newVal);
  console.log(oldVal);
});
```
**Supplied data example:** *see below*

An object with data on the current status of the timer.

The default object state:
```javascript
{
  time: "00:00:00",
  state: "stopped",
  milliseconds: 0,
  timestamp: 0,
  teamFinishTimes: {}
}
```

The timer tick happens every 100ms, if the current `state` is `"running"`.
- `time` is the current human readable time it is at (same as printed on the *Run Timer* panel).
- `state` is the current state; can be `"stopped"` (timer is at 0), `"running"` (timer is currently running), `"paused"` (timer was running but has been paused) or `"finished"` (timer has been ended and is showing the final time).
- `milliseconds` is the current time, but in milliseconds for calculations.
- `timestamp` is a `Date.now()` timestamp of when the last tick update happened, used internally for time recovery if NodeCG is closed/quits unexpectedly.
- `teamFinishTimes` is a keyed object for the time a team has finished. The key is the teams ID; the value is mostly a copy of the `timer` replicant at the time (minus the `teamFinishTimes` value), with 1 difference: the `state` will be replaced with either `"completed"` if this team successfully finished or `"forfeit"` if this team forfeit. This all applies even during non-race runs, so if you need to know if one of those was forfeit you still need to check the finish time here.

An example of the object, during a race while the timer is still running but team with ID `278de963-c1f4-4008-9d96-cb6106ab2598` has successfully finished:
```javascript
{
  time: "00:14:51",
  state: "running",
  milliseconds: 891053,
  timestamp: 1545591937067,
  teamFinishTimes: {
    "278de963-c1f4-4008-9d96-cb6106ab2598": {
      time: "00:14:37",
      state: "completed",
      milliseconds: 877274,
      timestamp: 1545591923282
    }
  }
}
```

#### `runFinishTimes`

*Types available in [./types/Timer.d.ts](../types/Timer.d.ts)*

**Example code:**
```javascript
const runFinishTimes = nodecg.Replicant('runFinishTimes', 'nodecg-speedcontrol');
runFinishTimes.on('change', (newVal, oldVal) => {
  console.log(newVal);
  console.log(oldVal);
});
```
**Supplied data example:** *see above under `timer`*

A keyed object; the keys are run IDs, the values are copies of the `timer` object, copied automatically every time a run successfully finishes. The time from these values is also displayed on the dashboard on each run if it was set.


## Messages Sent (*listenFor*)
([NodeCG documentation reference](https://nodecg.com/NodeCG.html#listenFor))

#### `twitchCommercialStarted`
**Example code:**
```javascript
nodecg.listenFor('twitchCommercialStarted', 'nodecg-speedcontrol', (data) => {
  console.log(data);
});
```
**Supplied data example:**
```javascript
{
  duration: 300
}
```

Emitted when a Twitch commercial is successfully started via this bundle. The supplied data is an object that contains `duration` which is an integer on how long the ads will run for in seconds.


## Messages Received (*sendMessage/sendMessageToBundle*)
([NodeCG documentation reference](https://nodecg.com/NodeCG.html#sendMessageToBundle))

#### `twitchStartCommercial`
**Example code (callback):**
```javascript
nodecg.sendMessageToBundle('twitchStartCommercial', 'nodecg-speedcontrol', (error, data) => {
  console.log(data);
});
```
**Example code (promise):**
```javascript
nodecg.sendMessageToBundle('twitchStartCommercial', 'nodecg-speedcontrol')
  .then((data) => { console.log(data); })
  .catch((err) => { console.log(err); });
```
**Supplied data example:**
```javascript
{
  duration: 300
}
```

Used to tell the Twitch API to run a commercial if applicable to your channel and you have the Twitch API integration enabled. The supplied data is an object that contains `duration` which is an integer on how long the ads will run for in seconds, an error will be returned if any issues occur. Currently the commercials will all be 300 seconds; there is no way to specify this yet.

#### `timerStart`
example stuff and desc here

#### `timerPause`
example stuff and desc here

#### `timerReset` (`force: boolean`).
example stuff and desc here

#### `timerEdit` (`time: string`)
example stuff and desc here

#### `timerStop` (`{ id: string, forfeit: boolean }`)
example stuff and desc here

#### `timerUndo` (`id: string`)
example stuff and desc here


## Our Own Messaging System

Alternatively if you are not sending/receiving your messages from a browser context, you can use our own messaging system that does not rely on socket.io; the advantage is you can do extension to extension messages with promises returned.

***TODO: rest of this documentation!***


## Example Bundles

- [speedcontrol-simpletext](https://github.com/speedcontrol/speedcontrol-simpletext), our own simple example bundle.
