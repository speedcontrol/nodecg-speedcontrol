# API Documentation: Replicants

*[Link to NodeCG documentation for reference.](https://nodecg.com/NodeCG.html#Replicant)*

- [runDataArray](#runDataArray)
- [runDataActiveRun](#runDataActiveRun)
- [runDataActiveRunSurrounding](#runDataActiveRunSurrounding)
- [timer](#timer)
- [runFinishTimes](#runFinishTimes)
- [timerChangesDisabled](#timerChangesDisabled)


## runDataArray

*Types available in [./types/RunData.d.ts](../types/RunData.d.ts)*

### Data
- *[`array`[`object`]]* An array of `runData` objects (relevant link: [`runData` Object Structure](./RunData.md)).
### Example code
```javascript
const runDataArray = nodecg.Replicant('runDataArray', 'nodecg-speedcontrol');
runDataArray.on('change', (newVal, oldVal) => {
  ...
});
```
### Example data
```javascript
[
  {
    // for example contents, see "`runData` Object Structure"
  }
]
```

All of the runs that have been imported/added. This is the same thing that is used in the *Run Player*/*Run Editor* panels, and any reordering done in the *Run Editor* panel is also reflected here. This can be an empty array if there are no runs defined.


## runDataActiveRun

*Types available in [./types/RunData.d.ts](../types/RunData.d.ts)*

### Data
- *[`object` or `undefined`]* Either a `runData` object or `undefined` if no active run is set (relevant link: [`runData` Object Structure](./RunData.md)).
### Example code
```javascript
const runDataActiveRun = nodecg.Replicant('runDataActiveRun', 'nodecg-speedcontrol');
runDataActiveRun.on('change', (newVal, oldVal) => {
  ...
});
```
### Example data
```javascript
{
  // for example contents, see "`runData` Object Structure"
}
```

Currently active run as set by the *Run Player* panel (or similar).


## runDataActiveRunSurrounding

*Types available in [./schemas/runDataActiveRunSurrounding.d.ts](../schemas/runDataActiveRunSurrounding.d.ts)*

### Data
- *[`object`]*
  - `previous` *[`string` or `undefined`]* ID of previous run if available.
  - `current` *[`string` or `undefined`]* ID of current run if available.
  - `next` *[`string` or `undefined`]* ID of next run if available.
### Example code
```javascript
const runDataActiveRunSurrounding = nodecg.Replicant('runDataActiveRunSurrounding', 'nodecg-speedcontrol');
runDataActiveRunSurrounding.on('change', (newVal, oldVal) => {
  ...
});
```
### Example data
```javascript
{
  previous: 'd057cac4-bbe8-4d2a-8a8d-8aa4c59c2d48',
  current: '64d5fda7-942a-4976-b4f6-008fccecc30e',
  next: '103e95ee-0b7a-4c07-848a-dfdfad4e1e78'
}
```

A reference for the previous/current/next run's IDs, if available. These are recalculated by this bundle if changes are detected in the `runDataArray` or `runDataActiveRun` replicants. Any of these values can be `undefined`, although `current` will always be set if the `runDataActiveRun` replicant is set.


## timer

*Types available in [./types/Timer.d.ts](../types/Timer.d.ts)*

### Data
- *[`object`]*
  - `time` *[`string`]* Current human readable time the timer is at; same as printed on the *Run Timer* panel.
  - `state` *[`string`]* Current state of the timer:
    - `"stopped"`: Timer is at 0
    - `"running"`: Timer is currently running
    - `"paused"`: Timer was runnig but has been paused
    - `"finished"`: Timer has been ended and is showing final time
  - `milliseconds` *[`number`]* Current time, but in milliseconds for calculations.
  - `timestamp` *[`number`]* A `Date.now()` timestamp of when the last tick update happened, used internally for time recovery if NodeCG is closed/quits unexpectedly.
  - `teamFinishTimes` *[`object`]* Keyed object for the time a team has finished; key is the team ID. This is used even during non-race runs, so if you need to know if one of those was forfeit you will need to check the finish time in here. Object is an identical copy to the `timer` replicant, except `teamFinishTimes` is removed, and `state` is different:
    - `"completed"` This team successfully finished the run
    - `"forfeit"` This team forfeit the runnow if one of those was forfeit you still need to check the finish time here.
### Example code
```javascript
const timer = nodecg.Replicant('timer', 'nodecg-speedcontrol');
timer.on('change', (newVal, oldVal) => {
  ...
});
```
### Example data
During a race while the timer is still running but team with ID `278de963-c1f4-4008-9d96-cb6106ab2598` has successfully finished:
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

An object with data on the current status of the timer. The timer tick happens every 100ms, if the current `state` is `"running"`.

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


## runFinishTimes

*Types available in [./types/Timer.d.ts](../types/Timer.d.ts)*

### Data
- *[`object`]* Keyed by run ID, with `timer` object clones.

### Example code
```javascript
const runFinishTimes = nodecg.Replicant('runFinishTimes', 'nodecg-speedcontrol');
runFinishTimes.on('change', (newVal, oldVal) => {
  ...
});
```
### Example data
```javascript
{
  'f926048c-3527-4d2f-96f6-680b81bf06e6': {
    // for example contents, see above under `timer`
  }
}
```

A keyed object; the keys are run IDs, the values are copies of the `timer` object, copied automatically every time a run successfully finishes. The time from these values is also displayed on the *Run Player*/*Run Editor* panels on each run if set.


## timerChangesDisabled

*Types available in [./schemas/timerChangesDisabled.d.ts](../schemas/timerChangesDisabled.d.ts)*

### Data
`timerChangesDisabled` *[`boolean`]* If the timer can be changed, either programatically or by a user.
### Example code
```javascript
const timerChangesDisabled = nodecg.Replicant('timerChangesDisabled', 'nodecg-speedcontrol');
// Listening to replicant changes.
timerChangesDisabled.on('change', (newVal, oldVal) => {
  ...
});
timerChangesDisabled.value = true; // Disable timer changes
timerChangesDisabled.value = false; // Enable timer changes
```
### Example data
```
false
```

A `boolean` that can be set by you, which is used to disable any changes of the timer. This can be useful if you know you are in a part of a marathon where you know the timer should not be touched and need to make sure it cannot be, for example an intermission. If this has been set to `true`, it can be overridden/toggled in the *Timer* panel if needed in an emergency.
