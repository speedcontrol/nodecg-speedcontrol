import clone from 'clone';
import livesplitCore from 'livesplit-core';
import { RunFinishTimes, TimerChangesDisabled } from '../../schemas';
import { RunDataActiveRun, Timer } from '../../types';
import * as events from './util/events';
import { msToTimeStr, processAck, timeStrToMS } from './util/helpers';
import { get } from './util/nodecg';

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
  nodecg.log.debug('[Timer] Replicant restored to default');
}

/**
 * Set timer replicant string time and milliseconds based off a millisecond value.
 * @param ms Milliseconds you want to set the timer replicant at.
 */
function setTime(ms: number): void {
  timerRep.value.time = msToTimeStr(ms);
  timerRep.value.milliseconds = ms;
  // nodecg.log.debug(`[Timer] Set to ${msToTimeStr(ms)}/${ms}`);
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
  nodecg.log.debug(`[Timer] Game time set to ${ms}`);
}

/**
 * Start/resume the timer, depending on the current state.
 * @param force Force the timer to start, even if it's state is running.
 */
async function startTimer(force?: boolean): Promise<void> {
  // Error if the timer is disabled.
  if (changesDisabled.value) {
    throw new Error('Timer changes are disabled');
  }
  // Error if the timer is finished.
  if (timerRep.value.state === 'finished') {
    throw new Error('Timer is in the finished state');
  }
  // Error if the timer isn't stopped or paused (and we're not forcing it).
  if (!force && !['stopped', 'paused'].includes(timerRep.value.state)) {
    throw new Error('Timer is not stopped/paused');
  }

  if (timer.currentPhase() === LS_TIMER_PHASE.NotRunning) {
    timer.start();
    nodecg.log.debug('[Timer] Started');
  } else {
    timer.resume();
    nodecg.log.debug('[Timer] Resumed');
  }
  setGameTime(timerRep.value.milliseconds);
  timerRep.value.state = 'running';
}

/**
 * Pause the timer.
 */
async function pauseTimer(): Promise<void> {
  // Error if the timer is disabled.
  if (changesDisabled.value) {
    throw new Error('Timer changes are disabled');
  }
  // Error if the timer isn't running.
  if (timerRep.value.state !== 'running') {
    throw new Error('Timer is not running');
  }

  timer.pause();
  timerRep.value.state = 'paused';
  nodecg.log.debug('[Timer] Paused');
}

/**
 * Reset the timer.
 */
async function resetTimer(force?: boolean): Promise<void> {
  // Error if the timer is disabled.
  if (!force && changesDisabled.value) {
    throw new Error('Timer changes are disabled');
  }
  // Error if the timer is stopped.
  if (timerRep.value.state === 'stopped') {
    throw new Error('Timer is stopped');
  }

  timer.reset(false);
  resetTimerRepToDefault();
  nodecg.log.debug('[Timer] Reset');
}

/**
 * Stop/finish the timer.
 * @param id Team's ID you wish to have finish (if there is an active run).
 * @param forfeit Specify this if the team has forfeit.
 */
async function stopTimer(id?: string, forfeit?: boolean): Promise<void> {
  // Error if the timer is disabled.
  if (changesDisabled.value) {
    throw new Error('Timer changes are disabled');
  }
  // Error if timer is not running.
  if (timerRep.value.state !== 'running') {
    throw new Error('Timer is not running');
  }
  // Error if there's an active run but no UUID was sent.
  if (!id && activeRun.value && activeRun.value.teams.length) {
    throw new Error('A run is active that has teams but no team ID was supplied');
  }
  // Error if the team has already finished.
  if (id && timerRep.value.teamFinishTimes[id]) {
    throw new Error('The specified team has already finished');
  }

  // If we have a UUID and an active run, set that team as finished.
  if (id && activeRun.value) {
    const timerRepCopy = clone(timerRep.value);
    delete timerRepCopy.teamFinishTimes;
    delete timerRepCopy.state;

    timerRep.value.teamFinishTimes[id] = {
      ...timerRepCopy,
      ...{ state: (forfeit) ? 'forfeit' : 'completed' },
    };

    nodecg.log.debug(
      `[Timer] Team ${id} finished at ${timerRepCopy.time}${(forfeit) ? ' (forfeit)' : ''}`,
    );
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
    nodecg.log.debug('[Timer] Finished');
  }
}

/**
 * Undo the timer from being stopped.
 * @param id ID of team you wish to undo (if there is an active run).
 */
async function undoTimer(id?: string): Promise<void> {
  // Error if the timer is disabled.
  if (changesDisabled.value) {
    throw new Error('Timer changes are disabled');
  }
  // Error if timer is not finished or running.
  if (!['finished', 'running'].includes(timerRep.value.state)) {
    throw new Error('Timer is not finished/running');
  }
  // Error if there's an active run but no UUID was sent.
  if (!id && activeRun.value) {
    throw new Error('A run is active but no team ID was supplied');
  }

  // If we have a UUID and an active run, remove that team's finish time.
  if (id && activeRun.value) {
    delete timerRep.value.teamFinishTimes[id];
    nodecg.log.debug(`[Timer] Team ${id} finish time undone`);
  }

  // Undo the split if needed.
  if (timerRep.value.state === 'finished') {
    timer.undoSplit();
    timerRep.value.state = 'running';
    if (activeRun.value && runFinishTimes.value[activeRun.value.id]) {
      delete runFinishTimes.value[activeRun.value.id];
    }
    nodecg.log.debug('[Timer] Undone');
  }
}

/**
 * Edit the timer time.
 * @param time Time string (HH:MM:SS).
 */
async function editTimer(time: string): Promise<void> {
  // Error if the timer is disabled.
  if (changesDisabled.value) {
    throw new Error('Timer changes are disabled');
  }
  // Error if the timer is not stopped/paused.
  if (!['stopped', 'paused'].includes(timerRep.value.state)) {
    throw new Error('Timer is not stopped/paused');
  }
  // Error if the string formatting is not correct.
  if (!time.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
    throw new Error('The supplied string is in the incorrect format');
  }

  const ms = timeStrToMS(time);
  setTime(ms);
  nodecg.log.debug(`[Timer] Edited to ${time}/${ms}`);
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
  nodecg.log.info(`[Timer] Recovered ${(missedTime / 1000).toFixed(2)} seconds of lost time.`);
  startTimer(true);
}

// NodeCG messaging system.
nodecg.listenFor('timerStart', (data, ack) => {
  startTimer()
    .then(() => processAck(ack, null))
    .catch((err) => processAck(ack, err));
});
nodecg.listenFor('timerPause', (data, ack) => {
  pauseTimer()
    .then(() => processAck(ack, null))
    .catch((err) => processAck(ack, err));
});
nodecg.listenFor('timerReset', (force, ack) => {
  resetTimer(force)
    .then(() => processAck(ack, null))
    .catch((err) => processAck(ack, err));
});
nodecg.listenFor('timerStop', (data, ack) => {
  stopTimer(data.id, data.forfeit)
    .then(() => processAck(ack, null))
    .catch((err) => processAck(ack, err));
});
nodecg.listenFor('timerUndo', (id, ack) => {
  undoTimer(id)
    .then(() => processAck(ack, null))
    .catch((err) => processAck(ack, err));
});
nodecg.listenFor('timerEdit', (time, ack) => {
  editTimer(time)
    .then(() => processAck(ack, null))
    .catch((err) => processAck(ack, err));
});

// Our messaging system.
events.listenFor('timerStart', (data, ack) => {
  startTimer()
    .then(() => processAck(ack, null))
    .catch((err) => processAck(ack, err));
});
events.listenFor('timerReset', (force, ack) => {
  resetTimer(force)
    .then(() => processAck(ack, null))
    .catch((err) => processAck(ack, err));
});
events.listenFor('timerStop', (data, ack) => {
  stopTimer(data.id, data.forfeit)
    .then(() => processAck(ack, null))
    .catch((err) => processAck(ack, err));
});

setInterval(tick, 100);
