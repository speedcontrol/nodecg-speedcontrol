# API Documentation: NodeCG Messaging System

- [Messages Sent (*listenFor*)](#Messages-Sent-listenFor)
  - [twitchCommercialStarted](#twitchCommercialStarted)
- [Messages Received (*sendMessage/sendMessageToBundle*)](#Messages-Sent-sendMessagesendMessageToBundle)
  - [twitchStartCommercial](#twitchCommercialStarted)
  - [timerStart](#timerStart)
  - [timerPause](#timerPause)
  - [timerReset](#timerReset)
  - [timerStop](#timerStop)
  - [timerUndo](#timerUndo)
  - [timerEdit](#timerEdit)


# Messages Sent (*listenFor*)

*[Link to NodeCG documentation for reference.](https://nodecg.com/NodeCG.html#listenFor)*

## twitchCommercialStarted

### Data
- `data` [`object`]
  - `duration` [`number`] How long the commercial will run for in seconds.
### Example code
```javascript
nodecg.listenFor('twitchCommercialStarted', 'nodecg-speedcontrol', (data) => {
  console.log(data);
});
```
### Example data
```javascript
{
  duration: 180
}
```

Emitted when a Twitch commercial is successfully started via this bundle.


# Messages Received (*sendMessage/sendMessageToBundle*)

*[Link to NodeCG documentation for reference.](https://nodecg.com/NodeCG.html#sendMessageToBundle)*

## twitchStartCommercial

### *No parameters*
### Data
- `data` [`object`]
  - `duration` [`number`] How long the commercial will run for in seconds.
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('twitchStartCommercial', 'nodecg-speedcontrol');
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('twitchStartCommercial', 'nodecg-speedcontrol', (error, data) => {
  // if no error, successful
  console.log(data);
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('twitchStartCommercial', 'nodecg-speedcontrol')
  .then((data) => { console.log(data); })
  .catch((err) => { console.log(err); });
```
### Example data
```javascript
{
  duration: 180
}
```

Used to tell the Twitch API to run a commercial if applicable to your channel and you have the Twitch API integration enabled. Currently the commercials will all be 180 seconds (3 minutes); there is no way to specify this yet.


## timerStart

### *No parameters*
### *No data returned*
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('timerStart', 'nodecg-speedcontrol');
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('timerStart', 'nodecg-speedcontrol', (error) => {
  // if no error, successful
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('timerStart', 'nodecg-speedcontrol')
  .then(() => { /* successful */ })
  .catch((err) => { console.log(err); });
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
nodecg.sendMessageToBundle('timerPause', 'nodecg-speedcontrol', (error) => {
  // if no error, successful
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('timerPause', 'nodecg-speedcontrol')
  .then(() => { /* successful */ })
  .catch((err) => { console.log(err); });
```

Will pause the timer. This will only work if the timer is `"running"`, and the `timerChangesDisabled` replicant is set to `false`.


## timerReset

### Parameters
- `force` [`boolean`] (default: `false`) Will reset the timer even if the `timerChangesDisabled` replicant is set to `true`.
### *No data returned*
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('timerReset', 'nodecg-speedcontrol', false);
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('timerReset', 'nodecg-speedcontrol', false, (error) => {
  // if no error, successful
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('timerReset', 'nodecg-speedcontrol', false)
  .then(() => { /* successful */ })
  .catch((err) => { console.log(err); });
```

Will fully reset the timer. This will only work if the timer is not `"stopped"`, and the `timerChangesDisabled` replicant is set to `false` (unless the `force` boolean is `true`).


## timerStop

### Parameters
- `options` [`object`]
  - `id` [`string`] Team ID to stop timer of.
  - `forfeit` [`boolean`] (default: `false`) If true, the finish time will be recorded as `"forfeit"` instead of `"completed"`.
### *No data returned*
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('timerStop', 'nodecg-speedcontrol', { id: '18341eb2-eb45-4184-98f6-e74baafaf71a', forfeit: false });
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('timerStop', 'nodecg-speedcontrol', { id: '18341eb2-eb45-4184-98f6-e74baafaf71a', forfeit: false }, (error) => {
  // if no error, successful
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('timerStop', 'nodecg-speedcontrol', { id: '18341eb2-eb45-4184-98f6-e74baafaf71a', forfeit: false })
  .then(() => { /* successful */ })
  .catch((err) => { console.log(err); });
```

Will stop the timer for the specified team ID. This must be supplied if there is a run active and it has any teams, otherwise it'll fail. This will only work if the timer is `"running"`, and the `timerChangesDisabled` replicant is set to `false`. If the timer is `"running"` and the team you specify is the only one left to finish, this will automatically set it to `"finished"`.


## timerUndo

### Parameters
- `id` [`string`] Team ID to undo timer of.
### *No data returned*
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('timerUndo', 'nodecg-speedcontrol', '18341eb2-eb45-4184-98f6-e74baafaf71a');
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('timerUndo', 'nodecg-speedcontrol', '18341eb2-eb45-4184-98f6-e74baafaf71a', (error) => {
  // if no error, successful
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('timerUndo', 'nodecg-speedcontrol','18341eb2-eb45-4184-98f6-e74baafaf71a')
  .then(() => { /* successful */ })
  .catch((err) => { console.log(err); });
```

Will undo a stopped timer for the specified team ID. This must be supplied if there is a run active and it has any teams, otherwise it'll fail. This will only work if the timer is `"finished"` or `"running"`, and the `timerChangesDisabled` replicant is set to `false`. If the timer is `"finished"`, this will automatically return it to `"running"`.


## timerEdit

### Parameters
- `time` [`string`] Time to set timer at; should be in the format `"HH:MM:SS"`.
### *No data returned*
### Example code (extension/no acknowledgement)
```javascript
nodecg.sendMessageToBundle('timerEdit', 'nodecg-speedcontrol', '01:37:23');
```
### Example code (callback)
```javascript
nodecg.sendMessageToBundle('timerEdit', 'nodecg-speedcontrol', '01:37:23', (error) => {
  // if no error, successful
});
```
### Example code (promise)
```javascript
nodecg.sendMessageToBundle('timerEdit', 'nodecg-speedcontrol', '01:37:23')
  .then(() => { /* successful */ })
  .catch((err) => { console.log(err); });
```

Will edit the timer to the specified time. This will only work if the timer is `"paused"` or `"stopped"`, and the `timerChangesDisabled` replicant is set to `false`.
