# API Documentation: NodeCG Messaging System

- [Messages Sent (*listenFor*)](#Messages-Sent-listenFor)
  - [twitchCommercialStarted](#twitchCommercialStarted)
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
  - [removeRun](#removeRun)
  - [returnToStart](#returnToStart)
  - [removeAllRuns](#removeAllRuns)
  - [twitchStartCommercial](#twitchStartCommercial)
  - [twitchUpdateChannelInfo](#twitchUpdateChannelInfo)
  - [updateFeaturedChannels](#updateFeaturedChannels)


# Messages Sent (*listenFor*)

*[Link to NodeCG documentation for reference.](https://nodecg.com/NodeCG.html#listenFor)*

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

Emitted when the featured channels should be updated, either automatically or via the *Twitch Control* panel, only if `twitch.ffzUseRepeater` is set to true in the bundle configuration. This is the same list that is given to the default integration. Only needed if you need to use an alternative script to update these instead of the default integration.


# Messages Received (*sendMessage/sendMessageToBundle*)

*[Link to NodeCG documentation for reference.](https://nodecg.com/NodeCG.html#sendMessageToBundle)*

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
  - `id` *[`string`]* Team ID to stop timer of.
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
- `id` *[`string`]* Team ID to undo timer of.
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
nodecg.sendMessageToBundle('changeActiveRun', 'nodecg-speedcontrol');
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('changeActiveRun', 'nodecg-speedcontrol', (err, noTwitchGame) => {
  ...
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('changeActiveRun', 'nodecg-speedcontrol')
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
  - `prevID` *[`string`]* If supplied and run is new, run will be added after the run with this ID.
  - `updateTwitch` *[`boolean`]* If Twitch integration is enabled and this is `true`, we will attempt to update the Twitch information with this run data.
### Data
- `noTwitchGame` *[`boolean`]* If the Twitch integration is enabled, `updateTwitch` was set to `true` and the Twitch directory could not be set automatically, this will return `true`.
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('modifyRun', 'nodecg-speedcontrol', {
  runData: { /* runData object */ },
  prevID: '889e22d3-d1ef-40b8-8b2a-1d7eabf84755',
  updateTwitch: false,
});
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('modifyRun', 'nodecg-speedcontrol', {
  runData: { /* runData object */ },
  prevID: '889e22d3-d1ef-40b8-8b2a-1d7eabf84755',
  updateTwitch: false,
}, (err, noTwitchGame) => {
  ...
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('modifyRun', 'nodecg-speedcontrol', {
  runData: { /* runData object */ },
  prevID: '889e22d3-d1ef-40b8-8b2a-1d7eabf84755',
  updateTwitch: false,
})
  .then((noTwitchGame) => { ... })
  .catch((err) => { ... });
```
### Example data
```javascript
false
```

Will either edit a run (if `runData` has an ID we already have added) or add a new run to the `runDataArray` replicant. If the run is also the active run, this will be updated as well.


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

### *No parameters*
### Data
- *[`object`]*
  - `duration` *[`number`]* How long the commercial will run for in seconds.
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('twitchStartCommercial', 'nodecg-speedcontrol');
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('twitchStartCommercial', 'nodecg-speedcontrol', (err, data) => {
  ...
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('twitchStartCommercial', 'nodecg-speedcontrol')
  .then((data) => { ... })
  .catch((err) => { ... });
```
### Example data
```javascript
{
  duration: 180
}
```

Used to tell the Twitch API to run a commercial if applicable to your channel and you have the Twitch API integration enabled. Currently the commercials will all be 180 seconds (3 minutes); there is no way to specify this yet.


## twitchUpdateChannelInfo

### Parameters
- *[`object`]*
  - `status` *[`string`]* What the title should be set to.
  - `game` *[`string`]* Directory on Twitch to set channel to.
### Data
- `noTwitchGame` *[`boolean`]* If the supplied `game` is not a valid directory on Twitch, this will return `true`.
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('twitchUpdateChannelInfo', 'nodecg-speedcontrol');
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('twitchUpdateChannelInfo', 'nodecg-speedcontrol', (err, noTwitchGame) => {
  ...
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('twitchUpdateChannelInfo', 'nodecg-speedcontrol')
  .then((noTwitchGame) => { ... })
  .catch((err) => { ... });
```
### Example data
```javascript
false
```

Used to update the Twitch status (title) and/or game (directory), if the integration is enabled. This is the same as changing it via the *Twitch Control* panel.


## updateFeaturedChannels

### Parameters
- `names` *[`array`[`string`]]* List of Twitch usernames to use.
### *No data returned*
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('updateFeaturedChannels', 'nodecg-speedcontrol');
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('updateFeaturedChannels', 'nodecg-speedcontrol', (err) => {
  ...
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('updateFeaturedChannels', 'nodecg-speedcontrol')
  .then(() => { ... })
  .catch((err) => { ... });
```

Used to update the featured channels, if the integration is enabled. This is the same as changing it via the *Twitch Control* panel.
