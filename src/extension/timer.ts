import clone from 'clone';
import livesplitCore from 'livesplit-core';
import { RunFinishTimes, TimerChangesDisabled } from '../../schemas';
import { RunDataActiveRun, Timer } from '../../types';
import * as events from './util/events';
import * as h from './util/helpers';
import { get } from './util/nodecg';

const { msToTimeStr, timeStrToMS, processAck } = h;
const nodecg = get();

const timerRep = nodecg.Replicant<Timer>('timer');
const activeRun = nodecg.Replicant<RunDataActiveRun>('runDataActiveRun');
const runFinishTimes = nodecg.Replicant<RunFinishTimes>('runFinishTimes');
const changesDisabled = nodecg.Replicant<TimerChangesDisabled>('timerChangesDisabled');
let timer: livesplitCore.Timer;

// Cross references for LiveSplit's TimerPhases.
const LS_TIMER_PHASE = {
  NotRunning: 0,
  Running: 1,
  Ended: 2,
  Paused: 3,
};

/**
 * Resets timer replicant to default settings.
 * We *should* be able to just do timerRep.opts.defaultValue but it doesn't work :(
 */
function resetTimerRepToDefault(): void {
  timerRep.value = {
    time: '00:00:00',
    state: 'stopped',
    milliseconds: 0,
    timestamp: 0,
    teamFinishTimes: {},
  };
}

/**
 * Set timer replicant string time and milliseconds based off a millisecond value.
 * @param ms Milliseconds you want to set the timer replicant at.
 */
function setTime(ms: number): void {
  timerRep.value.time = msToTimeStr(ms);
  timerRep.value.milliseconds = ms;
}

/**
 * Set game time.
 * Game Time is used so we can edit the timer easily.
 * @param ms Milliseconds you want to set the game time at.
 */
function setGameTime(ms: number): void {
  if (timerRep.value.state === 'stopped') {
    livesplitCore.TimeSpan.fromSeconds(0).with((t) => timer.setLoadingTimes(t));
    timer.initializeGameTime();
  }
  livesplitCore.TimeSpan.fromSeconds(ms / 1000).with((t) => timer.setGameTime(t));
}

/**
 * Start/resume the timer, depending on the current state.
 * @param force Force the timer to start, even if it's state is running.
 */
function startTimer(force?: boolean): Promise<void> {
  return new Promise((resolve): void => {
    // Error if the timer is disabled.
    if (changesDisabled.value) {
      throw new Error('Cannot start/resume timer as changes are disabled.');
    }
    // Error if the timer is finished.
    if (timerRep.value.state === 'finished') {
      throw new Error('Cannot start/resume timer as it is in the finished state.');
    }
    // Error if the timer isn't stopped or paused (and we're not forcing it).
    if (!force && !['stopped', 'paused'].includes(timerRep.value.state)) {
      throw new Error('Cannot start/resume timer as it is not stopped/pasued.');
    }

    if (timer.currentPhase() === LS_TIMER_PHASE.NotRunning) {
      timer.start();
    } else {
      timer.resume();
    }
    setGameTime(timerRep.value.milliseconds);
    timerRep.value.state = 'running';
    resolve();
  });
}

/**
 * Pause the timer.
 */
function pauseTimer(): Promise<void> {
  return new Promise((resolve): void => {
    // Error if the timer is disabled.
    if (changesDisabled.value) {
      throw new Error('Cannot start/resume timer as changes are disabled.');
    }
    // Error if the timer isn't running.
    if (timerRep.value.state !== 'running') {
      throw new Error('Cannot pause the timer as it is not running.');
    }
    timer.pause();
    timerRep.value.state = 'paused';
    resolve();
  });
}

/**
 * Reset the timer.
 */
function resetTimer(force?: boolean): Promise<void> {
  return new Promise((resolve): void => {
    // Error if the timer is disabled.
    if (!force && changesDisabled.value) {
      throw new Error('Cannot start/resume timer as changes are disabled.');
    }
    // Error if the timer is stopped.
    if (timerRep.value.state === 'stopped') {
      throw new Error('Cannot reset the timer as it is stopped.');
    }
    timer.reset(false);
    resetTimerRepToDefault();
    resolve();
  });
}

/**
 * Stop/finish the timer.
 * @param uuid Team's ID you wish to have finish (if there is an active run).
 */
function stopTimer(uuid?: string): Promise<void> {
  return new Promise((resolve): void => {
    // Error if the timer is disabled.
    if (changesDisabled.value) {
      throw new Error('Cannot start/resume timer as changes are disabled.');
    }
    // Error if timer is not running.
    if (timerRep.value.state !== 'running') {
      throw new Error('Cannot stop the timer as it is not running.');
    }
    // Error if there's an active run but no UUID was sent.
    if (!uuid && activeRun.value) {
      throw new Error('Cannot stop the timer as a run is active but no team ID was supplied.');
    }
    // Error if the team has already finished.
    if (uuid && timerRep.value.teamFinishTimes[uuid]) {
      throw new Error('Cannot stop the timer as the specified team has already finished.');
    }

    // If we have a UUID and an active run, set that team as finished.
    if (uuid && activeRun.value) {
      const timerRepCopy = clone(timerRep.value);
      delete timerRepCopy.teamFinishTimes;
      timerRep.value.teamFinishTimes[uuid] = timerRepCopy;
    }

    // Stop the timer if all the teams have finished (or no teams exist).
    const teamsCount = (activeRun.value) ? activeRun.value.teams.length : 0;
    const teamsFinished = Object.keys(timerRep.value.teamFinishTimes).length;
    if (teamsFinished >= teamsCount) {
      timer.split();
      timerRep.value.state = 'finished';
      if (activeRun.value) {
        runFinishTimes.value[activeRun.value.id] = timerRep.value.time;
      }
    }

    resolve();
  });
}

/**
 * Undo the timer from being stopped.
 * @param uuid ID of team you wish to undo (if there is an active run).
 */
function undoTimer(uuid?: string): Promise<void> {
  return new Promise((resolve): void => {
    // Error if the timer is disabled.
    if (changesDisabled.value) {
      throw new Error('Cannot start/resume timer as changes are disabled.');
    }
    // Error if timer is not finished or running.
    if (!['finished', 'running'].includes(timerRep.value.state)) {
      throw new Error('Cannot undo the timer as it is not finished/running.');
    }
    // Error if there's an active run but no UUID was sent.
    if (!uuid && activeRun.value) {
      throw new Error('Cannot undo the timer as a run is active but no team ID was supplied.');
    }

    // If we have a UUID and an active run, remove that team's finish time.
    if (uuid && activeRun.value) {
      delete timerRep.value.teamFinishTimes[uuid];
    }

    // Undo the split if needed.
    if (timerRep.value.state === 'finished') {
      timer.undoSplit();
      timerRep.value.state = 'running';
      if (activeRun.value && runFinishTimes.value[activeRun.value.id]) {
        delete runFinishTimes.value[activeRun.value.id];
      }
    }

    resolve();
  });
}

/**
 * Edit the timer time.
 * @param time Time string (HH:MM:SS).
 */
function editTimer(time: string): Promise<void> {
  return new Promise((resolve): void => {
    // Error if the timer is disabled.
    if (changesDisabled.value) {
      throw new Error('Cannot start/resume timer as changes are disabled.');
    }
    // Error if the timer is not stopped/paused.
    if (!['stopped', 'paused'].includes(timerRep.value.state)) {
      throw new Error('Cannot edit the timer as it is not stopped/paused.');
    }
    // Error if the string formatting is not correct.
    if (!time.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
      throw new Error('Cannot edit the timer as the supplied string is in the incorrect format.');
    }
    const ms = timeStrToMS(time);
    setTime(ms);
    resolve();
  });
}

/**
 * This stuff runs every 1/10th a second to keep the time updated.
 */
function tick(): void {
  if (timerRep.value.state === 'running') {
    // Calculates the milliseconds the timer has been running for and updates the replicant.
    const time = timer.currentTime().gameTime() as livesplitCore.TimeSpanRef;
    const ms = Math.floor((time.totalSeconds()) * 1000);
    setTime(ms);
    timerRep.value.timestamp = Date.now();
  }
}

// Sets up the timer with a single split.
const liveSplitRun = livesplitCore.Run.new();
liveSplitRun.pushSegment(livesplitCore.Segment.new('finish'));
timer = livesplitCore.Timer.new(liveSplitRun) as livesplitCore.Timer;

// If the timer was running when last closed, tries to resume it at the correct time.
if (timerRep.value.state === 'running') {
  const missedTime = Date.now() - timerRep.value.timestamp;
  const previousTime = timerRep.value.milliseconds;
  const timeOffset = previousTime + missedTime;
  setTime(timeOffset);
  nodecg.log.info('Timer recovered %s seconds of lost time.', (missedTime / 1000).toFixed(2));
  startTimer(true);
}

// NodeCG messaging system.
nodecg.listenFor('timerStart', (data, ack) => {
  startTimer()
    .then(() => processAck(null, ack))
    .catch((err) => processAck(err, ack));
});
nodecg.listenFor('timerPause', (data, ack) => {
  pauseTimer()
    .then(() => processAck(null, ack))
    .catch((err) => processAck(err, ack));
});
nodecg.listenFor('timerReset', (force, ack) => {
  resetTimer(force)
    .then(() => processAck(null, ack))
    .catch((err) => processAck(err, ack));
});
nodecg.listenFor('timerStop', (uuid, ack) => {
  stopTimer(uuid)
    .then(() => processAck(null, ack))
    .catch((err) => processAck(err, ack));
});
nodecg.listenFor('timerUndo', (uuid, ack) => {
  undoTimer(uuid)
    .then(() => processAck(null, ack))
    .catch((err) => processAck(err, ack));
});
nodecg.listenFor('timerEdit', (time, ack) => {
  editTimer(time)
    .then(() => processAck(null, ack))
    .catch((err) => processAck(err, ack));
});

// Our messaging system.
events.listenFor('timerStart', (data, ack) => {
  startTimer()
    .then(() => ack(null))
    .catch((err) => ack(err));
});
events.listenFor('timerReset', (force, ack) => {
  resetTimer(force)
    .then(() => ack(null))
    .catch((err) => ack(err));
});
events.listenFor('timerStop', (uuid, ack) => {
  stopTimer(uuid)
    .then(() => ack(null))
    .catch((err) => ack(err));
});

setInterval(() => tick(), 100);
