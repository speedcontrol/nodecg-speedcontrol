# API Documentation: NodeCG Messaging System

## Table of Contents

- [Messages Sent (*listenFor*)](#Messages-Sent-listenFor)
  - [twitchCommercialStarted](#twitchCommercialStarted)
  - [twitchExternalMetadata](#twitchExternalMetadata)
  - [twitchExternalCommercial](#twitchExternalCommercial)
  - [repeaterFeaturedChannels](#repeaterFeaturedChannels)
- [Messages Received (*sendMessage/sendMessageToBundle*)](#Messages-Received-sendMessagesendMessageToBundle)
  - [timerStart](#timerStart)
  - [timerPause](#timerPause)
  - [timerReset](#timerReset)
  - [timerStop](#timerStop)
  - [timerUndo](#timerUndo)
  - [timerEdit](#timerEdit)
  - [changeToNextRun](#changeToNextRun)
  - [changeActiveRun](#changeActiveRun)
  - [modifyRun](#modifyRun)
  - [modifyRelayPlayerID](#modifyRelayPlayerID)
  - [removeRun](#removeRun)
  - [returnToStart](#returnToStart)
  - [removeAllRuns](#removeAllRuns)
  - [twitchStartCommercial](#twitchStartCommercial)
  - [twitchStartCommercialTimer](#twitchStartCommercialTimer)
  - [twitchUpdateChannelInfo](#twitchUpdateChannelInfo)
  - [twitchAPIRequest](#twitchAPIRequest)
  - [updateFeaturedChannels](#updateFeaturedChannels)


# Messages Sent (*listenFor*)

*[Link to NodeCG documentation for reference.](https://www.nodecg.dev/docs/classes/listenFor)*

## twitchCommercialStarted

### Data
- *[`object`]*
  - `duration` *[`number`]* How long the commercial will run for in seconds.
### Example code
```javascript
nodecg.listenFor('twitchCommercialStarted', 'nodecg-speedcontrol', (data) => {
  ...
});
```
### Example data
```javascript
{
  duration: 180
}
```

Emitted when a Twitch commercial is successfully started via this bundle.

# twitchExternalMetadata

### Data
- *[`object`]*
  - `channelID` *[`string` or `undefined`]* Twitch channel ID (*not name!*) of the channel expecting it's metadata to be updated.
  - `title` *[`string` or `undefined`]* Title to be set.
  - `gameID` *[`string`]* Twitch game/category ID (*not name!*) of the game to be set.
### Example code
```javascript
nodecg.listenFor('twitchExternalMetadata', 'nodecg-speedcontrol', (data) => {
  ...
});
```
### Example data
```javascript
{
  channelID: '46573611',
  title: 'Good Games Marathon Continues',
  gameID: '1316'
}
```

Emitted when the Twitch metadata (title/game) should be updated, either automatically or via the *Twitch Control* panel, only if `twitch.metadataUseExternal` is set to true in the bundle configuration. Only needed if you need to use an alternative script to change this instead of the default integration.

## twitchExternalCommercial

### Data
- *[`object`]*
  - `duration` *[`number`]* How long the commercial should run for in seconds.
  - `fromDashboard` *[`boolean`]* If this message was triggered manually via a dashboard panel; internally used on the *Twitch Control* panel.
### Example code
```javascript
nodecg.listenFor('twitchExternalCommercial', 'nodecg-speedcontrol', (data) => {
  ...
});
```
### Example data
```javascript
{
  duration: 180,
  fromDashboard: false
}
```

Emmited when a commercial should be ran, either automatically or via the *Twitch Control* panel, only if `twitch.commercialsUseExternal` is set to true in the bundle configuration. Only needed if you need to use an alternative script to start commercials instead of the default integration.

## repeaterFeaturedChannels

### Data
- `names` *[`array`[`string`]]* List of Twitch usernames.
### Example code
```javascript
nodecg.listenFor('repeaterFeaturedChannels', 'nodecg-speedcontrol', (names) => {
  ...
});
```
### Example data
```javascript
[
  'zoton2',
  'ontwoplanks'
]
```

Emitted when the featured channels should be updated, either automatically or via the *Twitch Control* panel, only if `twitch.ffzUseRepeater` is set to true in the bundle configuration. Only needed if you need to use an alternative script to update these instead of the default integration.


# Messages Received (*sendMessage/sendMessageToBundle*)

*[Link to NodeCG documentation for reference.](https://www.nodecg.dev/docs/classes/sendMessageToBundle)*

## timerStart

### *No parameters*
### *No data returned*
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('timerStart', 'nodecg-speedcontrol');
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('timerStart', 'nodecg-speedcontrol', (err) => {
  ...
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('timerStart', 'nodecg-speedcontrol')
  .then(() => { ... })
  .catch((err) => { ... });
```

Will start the timer, or resume it if it was paused. This will only work if the timer is `"stopped"` or `"paused"`, and the `timerChangesDisabled` replicant is set to `false`.


## timerPause

### *No parameters*
### *No data returned*
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('timerPause', 'nodecg-speedcontrol');
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('timerPause', 'nodecg-speedcontrol', (err) => {
  ...
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('timerPause', 'nodecg-speedcontrol')
  .then(() => { ... })
  .catch((err) => { ... });
```

Will pause the timer. This will only work if the timer is `"running"`, and the `timerChangesDisabled` replicant is set to `false`.


## timerReset

### Parameters
- `force` *[`boolean`]* (default: `false`) Will reset the timer even if the `timerChangesDisabled` replicant is set to `true`.
### *No data returned*
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('timerReset', 'nodecg-speedcontrol', false);
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('timerReset', 'nodecg-speedcontrol', false, (err) => {
  ...
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('timerReset', 'nodecg-speedcontrol', false)
  .then(() => { ... })
  .catch((err) => { ... });
```

Will fully reset the timer. This will only work if the timer is not `"stopped"`, and the `timerChangesDisabled` replicant is set to `false` (unless `force` is `true`).


## timerStop

### Parameters
- *[`object`]*
  - `id` *[`string` or `undefined`]* Team ID to stop timer of; must be defined if run is active and has teams.
  - `forfeit` *[`boolean`]* (default: `false`) If true, the finish time will be recorded as `"forfeit"` instead of `"completed"`.
### *No data returned*
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('timerStop', 'nodecg-speedcontrol', {
  id: '18341eb2-eb45-4184-98f6-e74baafaf71a',
  forfeit: false
});
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('timerStop', 'nodecg-speedcontrol', {
  id: '18341eb2-eb45-4184-98f6-e74baafaf71a',
  forfeit: false
}, (err) => {
  ...
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('timerStop', 'nodecg-speedcontrol', {
  id: '18341eb2-eb45-4184-98f6-e74baafaf71a',
  forfeit: false
})
  .then(() => { ... })
  .catch((err) => { ... });
```

Will stop the timer for the specified team ID. This must be supplied if there is a run active and it has any teams, otherwise it'll fail. This will only work if the timer is `"running"`, and the `timerChangesDisabled` replicant is set to `false`. If the timer is `"running"` and the team you specify is the only one left to finish, this will automatically set it to `"finished"`.


## timerUndo

### Parameters
- `id` *[`string` or `undefined`]* Team ID to undo timer of; must be defined if run is active and has teams.
### *No data returned*
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('timerUndo', 'nodecg-speedcontrol', '18341eb2-eb45-4184-98f6-e74baafaf71a');
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('timerUndo', 'nodecg-speedcontrol', '18341eb2-eb45-4184-98f6-e74baafaf71a', (err) => {
  ...
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('timerUndo', 'nodecg-speedcontrol','18341eb2-eb45-4184-98f6-e74baafaf71a')
  .then(() => { ... })
  .catch((err) => { ... });
```

Will undo a stopped timer for the specified team ID. This must be supplied if there is a run active and it has any teams, otherwise it'll fail. This will only work if the timer is `"finished"` or `"running"`, and the `timerChangesDisabled` replicant is set to `false`. If the timer is `"finished"`, this will automatically return it to `"running"`.


## timerEdit

### Parameters
- `time` *[`string`]* Time to set timer at; should be in the format `"HH:MM:SS"`.
### *No data returned*
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('timerEdit', 'nodecg-speedcontrol', '01:37:23');
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('timerEdit', 'nodecg-speedcontrol', '01:37:23', (err) => {
  ...
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('timerEdit', 'nodecg-speedcontrol', '01:37:23')
  .then(() => { ... })
  .catch((err) => { ... });
```

Will edit the timer to the specified time. This will only work if the timer is `"paused"` or `"stopped"`, and the `timerChangesDisabled` replicant is set to `false`.


## changeToNextRun

### *No parameters*
### Data
- `noTwitchGame` *[`boolean`]* If the Twitch integration is enabled, auto-sync is turned on and the Twitch directory could not be set automatically, this will return `true`.
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('changeToNextRun', 'nodecg-speedcontrol');
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('changeToNextRun', 'nodecg-speedcontrol', (err, noTwitchGame) => {
  ...
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('changeToNextRun', 'nodecg-speedcontrol')
  .then((noTwitchGame) => { ... })
  .catch((err) => { ... });
```
### Example data
```javascript
false
```

Will move to the next run if possible; this is the same as pressing the "next game" button on the *Run Player* panel. This will only work if the timer is not `"running"` or `"paused"`.


## changeActiveRun

### Parameters
- `id` *[`string`]* ID of the run you wish to change to.
### Data
- `noTwitchGame` *[`boolean`]* If the Twitch integration is enabled, auto-sync is turned on and the Twitch directory could not be set automatically, this will return `true`.
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('changeActiveRun', 'nodecg-speedcontrol', '889e22d3-d1ef-40b8-8b2a-1d7eabf84755');
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('changeActiveRun', 'nodecg-speedcontrol', '889e22d3-d1ef-40b8-8b2a-1d7eabf84755', (err, noTwitchGame) => {
  ...
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('changeActiveRun', 'nodecg-speedcontrol', '889e22d3-d1ef-40b8-8b2a-1d7eabf84755')
  .then((noTwitchGame) => { ... })
  .catch((err) => { ... });
```
### Example data
```javascript
false
```

Will change to the run with the ID supplied if possible; this is the same as pressing the "play" button on a specific run on the *Run Player* panel. This will only work if the timer is not `"running"` or `"paused"`.


## modifyRun

### Parameters
- *[`object`]*
  - `runData` *[`object`]* A `runData` object (relevant link: [`runData` Object Structure](./RunData.md)).
  - `prevID` *[`string` or `undefined`]* If supplied and run is new, run will be added after the run with this ID.
  - `updateTwitch` *[`boolean`]* (default: `false`) If Twitch integration is enabled and this is `true`, we will attempt to update the Twitch information with this run data.
### Data
- `noTwitchGame` *[`boolean`]* If the Twitch integration is enabled, `updateTwitch` was set to `true` and the Twitch directory could not be set automatically, this will return `true`.
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('modifyRun', 'nodecg-speedcontrol', {
  runData: { /* runData object */ },
  prevID: '889e22d3-d1ef-40b8-8b2a-1d7eabf84755',
  updateTwitch: false
});
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('modifyRun', 'nodecg-speedcontrol', {
  runData: { /* runData object */ },
  prevID: '889e22d3-d1ef-40b8-8b2a-1d7eabf84755',
  updateTwitch: false
}, (err, noTwitchGame) => {
  ...
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('modifyRun', 'nodecg-speedcontrol', {
  runData: { /* runData object */ },
  prevID: '889e22d3-d1ef-40b8-8b2a-1d7eabf84755',
  updateTwitch: false
})
  .then((noTwitchGame) => { ... })
  .catch((err) => { ... });
```
### Example data
```javascript
false
```

Will either edit a run (if `runData` has an ID we already have added) or add a new run to the `runDataArray` replicant. If the run is also the active run, this will be updated as well.


## modifyRelayPlayerID

### Parameters
- *[`object`]*
  - `runID` *[`string`]* ID of the run you wish to switch the active relay player for.
  - `teamID` *[`string`]* ID of the team you wish to switch the active relay player for.
  - `playerID` *[`string`]* ID of the player you wish to switch the active relay player to.
### *No data returned*
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('modifyRelayPlayerID', 'nodecg-speedcontrol', {
  runID: 'f926048c-3527-4d2f-96f6-680b81bf06e6',
  teamID: 'f926048c-3527-4d2f-96f6-680b81bf06e6',
  playerID: '26a6dc65-7f39-4f33-a263-56be74bed783'
});
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('modifyRelayPlayerID', 'nodecg-speedcontrol', {
  runID: 'f926048c-3527-4d2f-96f6-680b81bf06e6',
  teamID: 'f926048c-3527-4d2f-96f6-680b81bf06e6',
  playerID: '26a6dc65-7f39-4f33-a263-56be74bed783'
}, (err) => {
  ...
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('modifyRelayPlayerID', 'nodecg-speedcontrol', {
  runID: 'f926048c-3527-4d2f-96f6-680b81bf06e6',
  teamID: 'f926048c-3527-4d2f-96f6-680b81bf06e6',
  playerID: '26a6dc65-7f39-4f33-a263-56be74bed783'
})
  .then(() => { ... })
  .catch((err) => { ... });
```

Will change the currently active relay player for the specified team inside the specified run. Only applicable if the run is marked as a relay.


## removeRun

### Parameters
- `id` *[`string`]* The ID of the run you wish to remove.
### *No data returned*
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('removeRun', 'nodecg-speedcontrol', '889e22d3-d1ef-40b8-8b2a-1d7eabf84755');
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('removeRun', 'nodecg-speedcontrol', '889e22d3-d1ef-40b8-8b2a-1d7eabf84755', (err) => {
  ...
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('removeRun', 'nodecg-speedcontrol', '889e22d3-d1ef-40b8-8b2a-1d7eabf84755')
  .then(() => { ... })
  .catch((err) => { ... });
```

Will remove the run with the supplied ID from the `runDataArray` replicant. This will *not* remove the active run if this ID happens to be the same.


## returnToStart

### *No parameters*
### *No data returned*
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('returnToStart', 'nodecg-speedcontrol');
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('returnToStart', 'nodecg-speedcontrol', (err) => {
  ...
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('returnToStart', 'nodecg-speedcontrol')
  .then(() => { ... })
  .catch((err) => { ... });
```

Will return the marathon schedule to the start; internally this just removes the active run. This will only work if the timer is not `"running"` or `"paused"`.


## removeAllRuns

### *No parameters*
### *No data returned*
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('removeAllRuns', 'nodecg-speedcontrol');
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('removeAllRuns', 'nodecg-speedcontrol', (err) => {
  ...
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('removeAllRuns', 'nodecg-speedcontrol')
  .then(() => { ... })
  .catch((err) => { ... });
```

Removes all of the runs in the `runDataArray` replicant, and also removes the active run. The timer is also reset if needed. This will only work if the timer is not `"running"` or `"paused"`.


## twitchStartCommercial

### Parameters
- *[`object`]*
  - `duration` *[`number`]* (default: `180`) How long you want the commercial to run for in seconds; if not supplied will default to 180s/3m.
  - `fromDashboard` *[`boolean`]* (default: `false`) If this message was triggered manually via a dashboard panel; internally used on the *Twitch Control* panel, for passing on via the `twitchExternalCommercial` message, if you use this.
### Data
- *[`object`]*
  - `duration` *[`number`]* How long the commercial will run for in seconds.
  - `fromDashboard` *[`boolean`]* If the commercial was triggered via a dashboard panel (see comment above for use cases).
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('twitchStartCommercial', 'nodecg-speedcontrol', { duration: 180, fromDashboard: false });
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('twitchStartCommercial', 'nodecg-speedcontrol', { duration: 180, fromDashboard: false }, (err, data) => {
  ...
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('twitchStartCommercial', 'nodecg-speedcontrol', { duration: 180, fromDashboard: false })
  .then((data) => { ... })
  .catch((err) => { ... });
```
### Example data
```javascript
{
  duration: 180,
  fromDashboard: false
}
```

Used to tell the Twitch API to run a commercial if applicable to your channel and you have the Twitch API integration enabled. You can specify the length using `duration` in the paramters object; if not specified it will default to 180.


## twitchStartCommercialTimer

### Parameters
- *[`object`]*
  - `duration` *[`number`]* How long you want the commercial timer to run for in seconds.
### *No data returned*
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('twitchStartCommercialTimer', 'nodecg-speedcontrol', { duration: 180 });
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('twitchStartCommercialTimer', 'nodecg-speedcontrol', { duration: 180 }, (err, data) => {
  ...
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('twitchStartCommercialTimer', 'nodecg-speedcontrol', { duration: 180 })
  .then((data) => { ... })
  .catch((err) => { ... });
```

***Does not run a commercial!*** Used to manually start the in-built "commercial timer" that will disable the commercial buttons in the dashboard and display the countdown, and also update the `twitchCommercialTimer` replicant. This may be useful if you also have external services running commercials on the Twitch channel but also use this bundle to run them as well, and wish to show that information to users on NodeCG and your other bundles.


## twitchUpdateChannelInfo

### Parameters
- *[`object`]*
  - `status` *[`string` or `undefined`]* What the title should be set to; if not supplied, will not be changed.
  - `game` *[`string` or `undefined`]* Directory on Twitch to set channel to; if not supplied, will be set to the default (configurable in the bundle configuration).
### Data
- `noTwitchGame` *[`boolean`]* If the supplied `game` is not a valid directory on Twitch, this will return `true`.
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('twitchUpdateChannelInfo', 'nodecg-speedcontrol', {
  status: 'Good Games Marathon Continues',
  game: 'Miami Vice'
});
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('twitchUpdateChannelInfo', 'nodecg-speedcontrol', {
  status: 'Good Games Marathon Continues',
  game: 'Miami Vice'
}, (err, noTwitchGame) => {
  ...
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('twitchUpdateChannelInfo', 'nodecg-speedcontrol', {
  status: 'Good Games Marathon Continues',
  game: 'Miami Vice'
})
  .then((noTwitchGame) => { ... })
  .catch((err) => { ... });
```
### Example data
```javascript
false
```

Used to update the Twitch status (title) and/or game (directory), if the integration is enabled. This is the same as changing it via the *Twitch Control* panel.


## twitchAPIRequest

*Notes about this message:*
 - *Internally we use the [needle](https://github.com/tomas/needle) package, so their documentation may be of help for this message.*
 - *This can be used via the NodeCG messaging system, although if used in an extension you should use [our messaging service](./Our-Messages.md) so you can actually get a proper response.*
 - *You may need to add an `additionalScope` to the [relevant configuration](../Configuration.md#Twitch).*

### Parameters
- *[`object`]*
  - `method` *[`string`]* Request HTTP type: `"get"`/`"head"`/`"delete"`/`"patch"`/`"post"`/`"put"`.
  - `endpoint` *[`string`]* Endpoint you wish to request.
  - `data` *[`object` (usually) or `undefined`]* Data, if any, to be sent alongside this request.
  - `newAPI` *[`boolean`]* (default: `false`) If this request is for Twitch's "new" API; if false it will request on the (now deprecated) v5 API.
### Data
- `response` *[`object`]* The received response; see the [needle](https://github.com/tomas/needle) documentation for more information.
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('twitchAPIRequest', 'nodecg-speedcontrol', {
  method: 'get',
  endpont: '/streams/markers',
  data: {
    user_id: '123', 
    description: 'hello, this is a marker!'
  },
  newAPI: true
});
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('twitchAPIRequest', 'nodecg-speedcontrol', {
  method: 'get',
  endpont: '/streams/markers',
  data: {
    user_id: '123', 
    description: 'hello, this is a marker!'
  },
  newAPI: true
}, (err, response) => {
  ...
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('twitchAPIRequest', 'nodecg-speedcontrol', {
  method: 'get',
  endpont: '/streams/markers',
  data: {
    user_id: '123', 
    description: 'hello, this is a marker!'
  },
  newAPI: true
})
  .then((response) => { ... })
  .catch((err) => { ... });
```
### Example data
*See the [needle](https://github.com/tomas/needle) documentation.*

Allows you to use the Twitch API implementation in this bundle to do your own requests if needed. You may need to add [additional scopes in the configuration](../Configuration.md#Twitch) if you need more authorisation than we provide by default to make your request. Supports either the v5 API or the "new" API via a boolean flag; ***you should use the "new" API if possible as v5 is now deprecated and newly registered applications cannot access it!***


## updateFeaturedChannels

### Parameters
- `names` *[`array`[`string`]]* List of Twitch usernames to use.
### *No data returned*
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('updateFeaturedChannels', 'nodecg-speedcontrol', [
  'zoton2',
  'ontwoplanks'
]);
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('updateFeaturedChannels', 'nodecg-speedcontrol', [
  'zoton2',
  'ontwoplanks'
], (err) => {
  ...
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('updateFeaturedChannels', 'nodecg-speedcontrol',[
  'zoton2',
  'ontwoplanks'
])
  .then(() => { ... })
  .catch((err) => { ... });
```

Used to update the featured channels, if the integration is enabled. This is the same as changing it via the *Twitch Control* panel. If you wish to not list any, supply an empty array.
