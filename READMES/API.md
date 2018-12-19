# API Documentation

Below is a list of the ways you can interact with this bundle from within your own layout bundles. This documentation assumes you have knowledge about [NodeCG](https://nodecg.com/) bundle development.

**This bundle may contain more than what is documented on here. If it's not mentioned, assume it to be unsupported and that it may change in an update.**


## Replicants

#### `> nodecg.Replicant('runDataArray')`
#### `> nodecg.Replicant('runDataActiveRun')`
#### `> nodecg.Replicant('stopwatch')`

#### `> nodecg.Replicant('defaultRunDataObject')`
#### `> nodecg.Replicant('defaultTeamObject')`
#### `> nodecg.Replicant('defaultPlayerObject')`


## Messages Sent

#### `> nodecg.listenFor('twitchAdStarted', callback)`

Emitted when a Twitch ad is successfully started via this bundle. Calls back with an object that contains `duration` which is an integer on how long the ads will run for.

#### `> nodecg.listenFor('resetTime', callback)`

#### `> nodecg.listenFor('timerReset', callback)`

Calls back with an integer which is the index of the team in the current run.

#### `> nodecg.listenFor('timerSplit', callback)`

Calls back with an integer which is the index of the team in the current run.


## Messages Received

#### `> nodecg.sendMessage('playTwitchAd', callback)`

Used to tell the Twitch API to run ads if applicable to your channel. Calls back with `error, data` format, data is an object that contains `duration` which is an integer on how long the ads will run for if successful.