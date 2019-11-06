# Migrating from v1.x to v2.x

Most of the changes for v2.x are in relation to the rewriting of the code, not a lot changed in regards to compatibility with other bundles, there are still some things of note.

If you have this bundle listed as a dependency in your bundle (`nodecg.bundleDependences`) don't forget to bump that up as well, for example `^2.0.0`.

- [Bumped required NodeCG version.](#nodecg-version)
- [Minor changes to the run data objects.](#run-data-changes)
- [Changes to messages sent out or listened for/replicants in this bundle.](#message-rep-changes)


### <a name="nodecg-version"></a> Bumped required NodeCG version

This bundle now requires NodeCG version `1.5.0`.


### <a name="run-data-changes"></a> Minor changes to the run data objects

We formally refer to the object structure that we store information about runs in as the "`runData` object". These are the objects stored in a few different places, for example in the array of the schedule in the `runDataArray` replicant, and the currently active run that is stored in the `runDataActiveRun` replicant. This object has undergone a few changes that you may need to take note of.

- All IDs (run, team, player) were changed from a number to a UUID string to be more unique.
- Removed the `teamLastID` and `playerLastID` keys as the above change makes them redundant.
- Instead of run data that isn't defined being either an empty string or `-1` (if usually a number), it has now been changed to being fully `undefined`. Normal falsy checks treat an empty string and `undefined` the same, but if you used the values for `estimateS`, `setupTimeS` or `scheduledS` for anything, you may need to tweak that code.


### <a name="message-rep-changes"></a> Changes to messages sent out or listened for/replicants in this bundle

#### Replicants:
- `timer`: how the `teamFinishTimes` key works has been tweaked very slightly; it is still a copy of the `timer` replicant at the time (minus the `teamFinishTimes` value), but the `state` key is tweaked and the value can now either be `"forfeit"` or `"completed"` depending on if the team forfeit or not.
- `runFinishTimes`: was previously undocumented, but is an object keyed by the run's ID if the timer was successfully finished at least once; the value used to be a string of the final time but has now been changed to a copy of the `timer` replicant object of the most recent fully completed time for that run.

#### Messages Sent:
- The `twitchAdStarted` message has formally been renamed to `twitchCommercialStarted`, although the original will still work for now but may be removed in the future.

#### Messages Received:
- The `playTwitchAd` message has formally been renamed to `twitchStartCommercial`, although the original will still work for now but may be removed in the future.
- Timer:
  - We added some messages you could send that *were* supported but not documented in a dev version of v1.x, which have now been removed and replaced (see below)
    - `startTimer`
    - `stopTimer` (`id`: number)
    - `resetTimer`
  - We had some messages that you could send that weren't officially supported that are now supported and have changed names, *check the [API documentation](API.md) for more information*
    - `startTime` (`force: boolean`) has been changed to `timerStart` (no arguments).
    - `pauseTime` has been changed to `timerPause`.
    - `resetTime` has been changed to `timerReset` (`force: boolean`).
    - `setTime` (`time: string`) has been changed to `timerEdit` (`time: string`).
    - `teamFinishTime` (`id: number`) has been removed (see `timerStop` below).
    - `teamFinishTimeUndo` (`id: number`) has been removed (see `timerUndo` below).
    - `finishTime` (no arguments) has been changed to `timerStop` (`{ id: string, forfeit: boolean }`).
    - `timerUndo` (`id: string`) has been added.

There may be some other undocumented replicants/messages that were changed in the development of v2.x, but we did not think these were worth documenting here. Please study the source code if needed, and submit an issue if there is something missing you feel you need. Also, as a general note, if a message/replicant is not mentioned in the [API documentation](API.md), assume it could change at any point.
