// Code based off of stuff used for GamesDoneQuick.
// https://github.com/GamesDoneQuick/sgdq15-layouts/blob/master/extension/stopwatches.js
// https://github.com/GamesDoneQuick/agdq18-layouts/blob/master/extension/timekeeping.js

import clone from 'clone';
import livesplitCore from 'livesplit-core';
import { RunData, RunFinishTimes, Timer } from '../../types';
import * as nodecgApiContext from './util/nodecg-api-context';

const nodecg = nodecgApiContext.get();

// Cross references for LiveSplit's TimerPhases.
const LS_TIMER_PHASE = {
  NotRunning: 0,
  Running: 1,
  Ended: 2,
  Paused: 3,
};

const runDataActiveRun = nodecg.Replicant<RunData>('runDataActiveRun');
const runFinishTimes = nodecg.Replicant<RunFinishTimes>('runFinishTimes', { defaultValue: {} });

// Storage for the stopwatch data.
const stopwatch = nodecg.Replicant<Timer>('timer');

// Sets up the timer with a single split.
const liveSplitRun = livesplitCore.Run.new();
liveSplitRun.pushSegment(livesplitCore.Segment.new('finish'));
const timer = livesplitCore.Timer.new(liveSplitRun);

// Return timer to existing time from above.
timer!.start();
timer!.pause();

// If the timer was running when last closed, tries to resume it at the correct time.
if (stopwatch.value.state === 'running') {
  const missedTime = Date.now() - stopwatch.value.timestamp;
  const previousTime = stopwatch.value.milliseconds;
  const timeOffset = previousTime + missedTime;
  nodecg.log.info('Recovered %s seconds of lost time.', (missedTime / 1000).toFixed(2));
  start(true);
  initGameTime(timeOffset);
} else {
  initGameTime(stopwatch.value.milliseconds);
}

// Listeners, redirected to functions below.
nodecg.listenFor('startTime', start);
nodecg.listenFor('pauseTime', pause);
nodecg.listenFor('finishTime', finish);
nodecg.listenFor('resetTime', reset);
nodecg.listenFor('setTime', edit);
nodecg.listenFor('teamFinishTime', teamFinishTime);
nodecg.listenFor('teamFinishTimeUndo', teamFinishTimeUndo);

// This stuff runs every 1/10th a second to keep the time updated.
setInterval(tick, 100);
function tick() {
  // Will not run if timer isn't running or game time doesn't exist.
  if (stopwatch.value.state === 'running' && timer!.currentTime().gameTime()) {
    // Calculates the milliseconds the timer has been running for and updates the stopwatch.
    const ms = Math.floor((timer!.currentTime()!.gameTime()!.totalSeconds()) * 1000);
    stopwatch.value.time = msToTime(ms);
    stopwatch.value.milliseconds = ms;
    stopwatch.value.timestamp = Date.now();
  }
}

function start(force?: boolean) {
  // Catch if timer is running and we called this function.
  if (!force && stopwatch.value.state === 'running') {
    return;
  }

  // Start/resume the timer depending on which is needed.
  stopwatch.value.state = 'running';
  if (timer!.currentPhase() === LS_TIMER_PHASE.NotRunning) {
    timer!.start();
    initGameTime(stopwatch.value.milliseconds);
  } else {
    timer!.resume();
  }
}

function pause() {
  timer!.pause();
  stopwatch.value.state = 'paused';
}

function reset() {
  timer!.pause();
  timer!.reset(true);
  resetStopwatchToDefault();
}

function finish() {
  timer!.pause(); // For now this just pauses the timer.
  stopwatch.value.state = 'finished';
  if (runDataActiveRun.value) {
    runFinishTimes.value[runDataActiveRun.value.id] = stopwatch.value.time;
  }
}

function edit(time:string) {
  // Check to see if the time was given in the correct format and if it's stopped/paused.
  if (stopwatch.value.state === 'stopped' || stopwatch.value.state === 'paused'
  || time.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
    const ms = timeToMS(time);
    livesplitCore.TimeSpan.fromSeconds((ms / 1000)).with(t => timer!.setGameTime(t));
    stopwatch.value.time = msToTime(ms);
    stopwatch.value.milliseconds = ms;
  }
}

function teamFinishTime(id: number) {
  const stopwatchCopy = clone(stopwatch.value);
  delete stopwatchCopy.teamFinishTimes;
  stopwatch.value.teamFinishTimes[id] = stopwatchCopy;
}

function teamFinishTimeUndo(id: number) {
  delete stopwatch.value.teamFinishTimes[id];
}

// Game Time is used so we can edit the timer easily.
function initGameTime(ms: number) {
  livesplitCore.TimeSpan.fromSeconds(0).with(t => timer!.setLoadingTimes(t));
  timer!.initializeGameTime();
  livesplitCore.TimeSpan.fromSeconds((ms / 1000)).with(t => timer!.setGameTime(t));
}

// Resets stopwatch to it's defaults.
function resetStopwatchToDefault() {
  // We *should* be able to just do stopwatch.opts.defaultValue but it doesn't work :(
  stopwatch.value.time = '00:00:00';
  stopwatch.value.state = 'stopped';
  stopwatch.value.milliseconds = 0;
  stopwatch.value.timestamp = 0;
  stopwatch.value.teamFinishTimes = {};
}

function msToTime(ms: number) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  const hoursStr = (hours < 10) ? `0${hours}` : `${hours}`;
  const minutesStr = (minutes < 10) ? `0${minutes}` : `${minutes}`;
  const secondsStr = (seconds < 10) ? `0${seconds}` : `${seconds}`;

  return `${hoursStr}:${minutesStr}:${secondsStr}`;
}

function timeToMS(duration: string) {
  const ts = duration.split(':');
  if (ts.length === 2) ts.unshift('00'); // Adds 0 hours if they are not specified.
  return Date.UTC(1970, 0, 1, parseInt(ts[0], 0), parseInt(ts[1], 0), parseInt(ts[2], 0));
}

nodecg.listenFor('startTimer', () => {
  start();
});

nodecg.listenFor('stopTimer', (teamID: number) => {

  if (!Number.isInteger(teamID) || !runDataActiveRun.value) {
    return;
  }

  teamFinishTime(teamID);

  const amountOfTeamsTotal = runDataActiveRun.value.teams.length;
  const amountOfTeamsFinished = Object.keys(stopwatch.value.teamFinishTimes).length;

  if (amountOfTeamsFinished >= amountOfTeamsTotal) {
    finish();
  }
});

nodecg.listenFor('resetTimer', () => {
  reset();
});
