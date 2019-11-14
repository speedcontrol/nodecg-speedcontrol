# API Documentation: NodeCG Messaging System

*[Link to NodeCG documentation for reference.](https://nodecg.com/NodeCG.html#Replicant)*

- [Primary Example](#example)
  - [Secondary Example](#example)


# Messages Sent (*listenFor*)
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
  duration: 180
}
```

Emitted when a Twitch commercial is successfully started via this bundle. The supplied data is an object that contains `duration` which is a number on how long the ads will run for in seconds.


## Messages Received (*sendMessage/sendMessageToBundle*)
([NodeCG documentation reference](https://nodecg.com/NodeCG.html#sendMessageToBundle))

#### `twitchStartCommercial`

**Example code (extension/no acknowledgement):**
```javascript
nodecg.sendMessageToBundle('twitchStartCommercial', 'nodecg-speedcontrol');
```
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
  duration: 180
}
```

Used to tell the Twitch API to run a commercial if applicable to your channel and you have the Twitch API integration enabled. The supplied data is an object that contains `duration` which is a number on how long the ads will run for in seconds, an error will be returned if any issues occur. Currently the commercials will all be 180 seconds (3 minutes); there is no way to specify this yet.

#### `timerStart`

**Example code (extension/no acknowledgement):**
```javascript
nodecg.sendMessageToBundle('timerStart', 'nodecg-speedcontrol');
```
**Example code (callback):**
```javascript
nodecg.sendMessageToBundle('timerStart', 'nodecg-speedcontrol', (error) => {
  // if no error, successful
});
```
**Example code (promise):**
```javascript
nodecg.sendMessageToBundle('timerStart', 'nodecg-speedcontrol')
  .then(() => { /* successful */ })
  .catch((err) => { console.log(err); });
```
*No data returned*

Will start the timer, or resume it if it was paused. This will only work if the timer is `"stopped"` or `"paused"`, and the `timerChangesDisabled` replicant is set to `false`.

#### `timerPause`

**Example code (extension/no acknowledgement):**
```javascript
nodecg.sendMessageToBundle('timerPause', 'nodecg-speedcontrol');
```
**Example code (callback):**
```javascript
nodecg.sendMessageToBundle('timerPause', 'nodecg-speedcontrol', (error) => {
  // if no error, successful
});
```
**Example code (promise):**
```javascript
nodecg.sendMessageToBundle('timerPause', 'nodecg-speedcontrol')
  .then(() => { /* successful */ })
  .catch((err) => { console.log(err); });
```
*No data returned*

Will pause the timer. This will only work if the timer is `"running"`, and the `timerChangesDisabled` replicant is set to `false`.

#### `timerReset (force: boolean)`

**Example code (extension/no acknowledgement):**
```javascript
nodecg.sendMessageToBundle('timerReset', 'nodecg-speedcontrol', false);
```
**Example code (callback):**
```javascript
nodecg.sendMessageToBundle('timerReset', 'nodecg-speedcontrol', false, (error) => {
  // if no error, successful
});
```
**Example code (promise):**
```javascript
nodecg.sendMessageToBundle('timerReset', 'nodecg-speedcontrol', false)
  .then(() => { /* successful */ })
  .catch((err) => { console.log(err); });
```
*No data returned*

Will fully reset the timer. This will only work if the timer is not `"stopped"`, and the `timerChangesDisabled` replicant is set to `false` (unless the `force` boolean is `true`).

#### `timerStop ({ id: string, forfeit: boolean})`

**Example code (extension/no acknowledgement):**
```javascript
nodecg.sendMessageToBundle('timerStop', 'nodecg-speedcontrol', { id: '18341eb2-eb45-4184-98f6-e74baafaf71a', forfeit: false });
```
**Example code (callback):**
```javascript
nodecg.sendMessageToBundle('timerStop', 'nodecg-speedcontrol', { id: '18341eb2-eb45-4184-98f6-e74baafaf71a', forfeit: false }, (error) => {
  // if no error, successful
});
```
**Example code (promise):**
```javascript
nodecg.sendMessageToBundle('timerStop', 'nodecg-speedcontrol', { id: '18341eb2-eb45-4184-98f6-e74baafaf71a', forfeit: false })
  .then(() => { /* successful */ })
  .catch((err) => { console.log(err); });
```
*No data returned*

Will stop the timer for the specified team ID. This must be supplied if there is a run active and it has any teams, otherwise it'll fail. This will only work if the timer is `"running"`, and the `timerChangesDisabled` replicant is set to `false`. If `forfeit` is `true` the finish time will be recorded as `"forfeit"` instead of `"completed"`. If the timer is `"running"` and the team you specify is the only one left to finish, this will automatically set it to `"finished"`.

#### `timerUndo (id: string)`

**Example code (extension/no acknowledgement):**
```javascript
nodecg.sendMessageToBundle('timerUndo', 'nodecg-speedcontrol', '18341eb2-eb45-4184-98f6-e74baafaf71a');
```
**Example code (callback):**
```javascript
nodecg.sendMessageToBundle('timerUndo', 'nodecg-speedcontrol', '18341eb2-eb45-4184-98f6-e74baafaf71a', (error) => {
  // if no error, successful
});
```
**Example code (promise):**
```javascript
nodecg.sendMessageToBundle('timerUndo', 'nodecg-speedcontrol','18341eb2-eb45-4184-98f6-e74baafaf71a')
  .then(() => { /* successful */ })
  .catch((err) => { console.log(err); });
```
*No data returned*

Will undo a stopped timer for the specified team ID. This must be supplied if there is a run active and it has any teams, otherwise it'll fail. This will only work if the timer is `"finished"` or `"running"`, and the `timerChangesDisabled` replicant is set to `false`. If the timer is `"finished"`, this will automatically return it to `"running"`.

#### `timerEdit (time: string)`

**Example code (extension/no acknowledgement):**
```javascript
nodecg.sendMessageToBundle('timerEdit', 'nodecg-speedcontrol', '01:37:23');
```
**Example code (callback):**
```javascript
nodecg.sendMessageToBundle('timerEdit', 'nodecg-speedcontrol', '01:37:23', (error) => {
  // if no error, successful
});
```
**Example code (promise):**
```javascript
nodecg.sendMessageToBundle('timerEdit', 'nodecg-speedcontrol', '01:37:23')
  .then(() => { /* successful */ })
  .catch((err) => { console.log(err); });
```
*No data returned*

Will edit the timer to the specified time. Should be in the format `"HH:MM:SS"`. This will only work if the timer is `"paused"` or `"stopped"`, and the `timerChangesDisabled` replicant is set to `false`.
