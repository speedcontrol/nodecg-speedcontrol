# Migrating from v0.9 to v1.x

If you've been using Speedcontrol in some form before v1.x and developing layout bundles that use it, you will need to take note of these changes if you want to continue using your bundles.

If you have the bundle listed as a dependency in your bundle (`nodecg.bundleDependences`) don't forget to bump that up as well, for example `^1.0.0`.

- [Major changes to the run data objects.](#run-data-changes)
- [Split some functionality off into smaller "support bundles".](#support-bundles)
- [Changes to messages/replicants sent out by this bundle.](#message-rep-changes)
- [Removed Gaming4Good donation tracker support.](#g4g-removed)
- [Removed some leftover graphics related files.](#removed-graphics)
- [Removed editing mode.](#edit-mode)
- [Removed the "Force Refresh Intermission" button.](#force-refresh-intermission)

### <a name="run-data-changes"></a> Major changes to the run data objects

We formally refer to the object structure that we store information about runs in as the "`runData` object". These are the objects stored in a few different places, for example in the array of the schedule in the `runDataArray` replicant, and the currently active run that is stored in the `runDataActiveRun` replicant. This object has undergone a few changes that you may need to take note of.

- Added a `release` string that can be used to store information on when the game was released.
- Team objects within the `teams` array:
  - Added an `id` number for easy identifying of a team object without it needing to have a unique name.
  - The `custom` boolean used to indicate if a team had a custom name has been removed.
  - The `name` of the team will now be an empty string if it has not been customised.
  - The `members` array has been renamed to `players`.
    - Added an `id` number for unique identification of a player within a run. *This is only unique for this run*.
    - The `team` name has been removed and been replaced with `teamID` which correlates to the ID mentioned in the team object.
    - `names.international` has simply been replaced by `name` which stores the same information.
	- `twitch.uri` which stored the Twitch channel URL has been replaced with `social.twitch` which only stores the username.
	- `region` has been renamed to `country` to better describe what it should contain.
- The `players` array that stored a list of all the players in a run has been removed; if you need access to all the players, you'll need to loop through all the `players` arrays inside the team objects inside of the `teams` array.
- `runID` has been simply renamed to `id`.
- Added `teamLastID` and `playerLastID` to store the last IDs used for teams/players, *not intended for layout use*.
- Removed the `screens` and `cameras` arrays because they had never actually been used anyway.

### <a name="support-bundles"></a> Split some functionality off into smaller "support bundles"

Some of the functionality of this bundle has been split off into separate bundles so as to not bloat this main one too much; this is (mainly) the parts relating to donation tracking. See the [Extra Support Bundles](../README.md#extra-support-bundles) section in the main README file. The unsupported/undocumented "ESAController" code was also moved to [esamarathon/speedcontrol-esacontroller](https://github.com/esamarathon/speedcontrol-esacontroller), but we advise you don't rely on it if you really happen to be using it. The experimental/undocumented Twitch (auto)highlighting functionality was also moved to [speedcontrol-highlighting](https://github.com/speedcontrol/speedcontrol-highlighting).

### <a name="message-rep-changes"></a> Changes to messages/replicants sent out by this bundle

The `stopwatch` replicant has been named to `timer` as it is a more common name for this feature.

The `runEnded` message has been removed; internally we only used this for ESAController, and this functionality can be replicated by listening to the `timer` replicant.

If you listen to `startTime`, `pauseTime`, `setTime`, `resetTime` or `finishTime` for any reason, these are still available but it's not recommended you listen to these, because they're not reliable ways of knowing what has actually happened and may be changed in the future. Listen to the `timer` replicant instead.

The `timerSplit` and `timerReset` messages (badly named; used to know when a team has finished/unfinished in a race) have been removed, and their functionality has been replicated in the `timer` replicant for more permentant storage of the finish times (see the [API Documentation](API.md)).

Also, as a general note, if a message/replicant is not mentioned in the [API Documentation](API.md), assume it could change at any point.

### <a name="g4g-removed"></a> Removed Gaming4Good donation tracker support

As this wasn't used very much and we weren't sure how well it worked any more, we decided to remove this functionality.

### <a name="removed-graphics"></a> Removed some leftover graphics related files

In the `graphics` folder there used to be some left over files that you could use to aid you in developing your layout bundles, but they were outdated and better off being put in another bundle.

### <a name="edit-mode"></a> Removed editing mode

A while ago this bundle used to have a feature where if you coded your layout bundles correctly you could edit them on the fly in your browser. This wasn't kept up to date in a while and is something that can easily be done in streaming applications instead of in a webpage.

### <a name="force-refresh-intermission"></a> Removed the "Force Refresh Intermission" button

There used to be a dashboard button labelled *Force Refresh Intermission* that sent a NodeCG message `forceRefreshIntermission` that you could listen for in your layout bundles. We realised this would be better put in your own layout bundles instead if you needed it.