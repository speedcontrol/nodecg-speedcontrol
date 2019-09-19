import clone from 'clone';
import livesplitCore from 'livesplit-core';
import { NodeCG, Replicant } from 'nodecg/types/server'; // eslint-disable-line
import { RunFinishTimes, TimerChangesDisabled } from '../../schemas';
import { RunDataActiveRun, Timer } from '../../types';
import * as events from './util/events';
import Helpers from './util/helpers';

const { msToTimeStr, timeStrToMS, processAck } = Helpers;

// Cross references for LiveSplit's TimerPhases.
const LS_TIMER_PHASE = {
  NotRunning: 0,
  Running: 1,
  Ended: 2,
  Paused: 3,
};

export default class TimerApp {
  /* eslint-disable lines-between-class-members */
  private timerRep: Replicant<Timer>;
  private activeRun: Replicant<RunDataActiveRun>;
  private runFinishTimes: Replicant<RunFinishTimes>
  private changesDisabled: Replicant<TimerChangesDisabled>;
  private timer: livesplitCore.Timer;
  /* eslint-enable lines-between-class-members */

  constructor(nodecg: NodeCG) {
    this.timerRep = nodecg.Replicant('timer');
    this.activeRun = nodecg.Replicant('runDataActiveRun');
    this.runFinishTimes = nodecg.Replicant('runFinishTimes');
    this.changesDisabled = nodecg.Replicant('timerChangesDisabled');

    // Sets up the timer with a single split.
    const liveSplitRun = livesplitCore.Run.new();
    liveSplitRun.pushSegment(livesplitCore.Segment.new('finish'));
    this.timer = livesplitCore.Timer.new(liveSplitRun) as livesplitCore.Timer;

    // If the timer was running when last closed, tries to resume it at the correct time.
    if (this.timerRep.value.state === 'running') {
      const missedTime = Date.now() - this.timerRep.value.timestamp;
      const previousTime = this.timerRep.value.milliseconds;
      const timeOffset = previousTime + missedTime;
      this.setTime(timeOffset);
      nodecg.log.info('Timer recovered %s seconds of lost time.', (missedTime / 1000).toFixed(2));
      this.startTimer(true);
    }

    // NodeCG messaging system.
    nodecg.listenFor('timerStart', (data, ack) => {
      this.startTimer()
        .then(() => processAck(null, ack))
        .catch((err) => processAck(err, ack));
    });
    nodecg.listenFor('timerPause', (data, ack) => {
      this.pauseTimer()
        .then(() => processAck(null, ack))
        .catch((err) => processAck(err, ack));
    });
    nodecg.listenFor('timerReset', (force, ack) => {
      this.resetTimer(force)
        .then(() => processAck(null, ack))
        .catch((err) => processAck(err, ack));
    });
    nodecg.listenFor('timerStop', (uuid, ack) => {
      this.stopTimer(uuid)
        .then(() => processAck(null, ack))
        .catch((err) => processAck(err, ack));
    });
    nodecg.listenFor('timerUndo', (uuid, ack) => {
      this.undoTimer(uuid)
        .then(() => processAck(null, ack))
        .catch((err) => processAck(err, ack));
    });
    nodecg.listenFor('timerEdit', (time, ack) => {
      this.editTimer(time)
        .then(() => processAck(null, ack))
        .catch((err) => processAck(err, ack));
    });

    // Our messaging system.
    events.listenFor('timerStart', (data, ack) => {
      this.startTimer()
        .then(() => ack(null))
        .catch((err) => ack(err));
    });
    events.listenFor('timerReset', (force, ack) => {
      this.resetTimer(force)
        .then(() => ack(null))
        .catch((err) => ack(err));
    });
    events.listenFor('timerStop', (uuid, ack) => {
      this.stopTimer(uuid)
        .then(() => ack(null))
        .catch((err) => ack(err));
    });

    setInterval(() => this.tick(), 100);
  }

  /**
   * Start/resume the timer, depending on the current state.
   * @param force Force the timer to start, even if it's state is running.
   */
  startTimer(force?: boolean): Promise<void> {
    return new Promise((resolve): void => {
      // Error if the timer is disabled.
      if (this.changesDisabled.value) {
        throw new Error('Cannot start/resume timer as changes are disabled.');
      }
      // Error if the timer is finished.
      if (this.timerRep.value.state === 'finished') {
        throw new Error('Cannot start/resume timer as it is in the finished state.');
      }
      // Error if the timer isn't stopped or paused (and we're not forcing it).
      if (!force && !['stopped', 'paused'].includes(this.timerRep.value.state)) {
        throw new Error('Cannot start/resume timer as it is not stopped/pasued.');
      }

      if (this.timer.currentPhase() === LS_TIMER_PHASE.NotRunning) {
        this.timer.start();
      } else {
        this.timer.resume();
      }
      this.setGameTime(this.timerRep.value.milliseconds);
      this.timerRep.value.state = 'running';
      resolve();
    });
  }

  /**
   * Pause the timer.
   */
  pauseTimer(): Promise<void> {
    return new Promise((resolve): void => {
      // Error if the timer is disabled.
      if (this.changesDisabled.value) {
        throw new Error('Cannot start/resume timer as changes are disabled.');
      }
      // Error if the timer isn't running.
      if (this.timerRep.value.state !== 'running') {
        throw new Error('Cannot pause the timer as it is not running.');
      }
      this.timer.pause();
      this.timerRep.value.state = 'paused';
      resolve();
    });
  }

  /**
   * Reset the timer.
   */
  resetTimer(force?: boolean): Promise<void> {
    return new Promise((resolve): void => {
      // Error if the timer is disabled.
      if (!force && this.changesDisabled.value) {
        throw new Error('Cannot start/resume timer as changes are disabled.');
      }
      // Error if the timer is stopped.
      if (this.timerRep.value.state === 'stopped') {
        throw new Error('Cannot reset the timer as it is stopped.');
      }
      this.timer.reset(false);
      this.resetTimerRepToDefault();
      resolve();
    });
  }

  /**
   * Stop/finish the timer.
   * @param uuid Team's ID you wish to have finish (if there is an active run).
   */
  stopTimer(uuid?: string): Promise<void> {
    return new Promise((resolve): void => {
      // Error if the timer is disabled.
      if (this.changesDisabled.value) {
        throw new Error('Cannot start/resume timer as changes are disabled.');
      }
      // Error if timer is not running.
      if (this.timerRep.value.state !== 'running') {
        throw new Error('Cannot stop the timer as it is not running.');
      }
      // Error if there's an active run but no UUID was sent.
      if (!uuid && this.activeRun.value) {
        throw new Error('Cannot stop the timer as a run is active but no team ID was supplied.');
      }
      // Error if the team has already finished.
      if (uuid && this.timerRep.value.teamFinishTimes[uuid]) {
        throw new Error('Cannot stop the timer as the specified team has already finished.');
      }

      // If we have a UUID and an active run, set that team as finished.
      if (uuid && this.activeRun.value) {
        const timerRepCopy = clone(this.timerRep.value);
        delete timerRepCopy.teamFinishTimes;
        this.timerRep.value.teamFinishTimes[uuid] = timerRepCopy;
      }

      // Stop the timer if all the teams have finished (or no teams exist).
      const teamsCount = (this.activeRun.value) ? this.activeRun.value.teams.length : 0;
      const teamsFinished = Object.keys(this.timerRep.value.teamFinishTimes).length;
      if (teamsFinished >= teamsCount) {
        this.timer.split();
        this.timerRep.value.state = 'finished';
        if (this.activeRun.value) {
          this.runFinishTimes.value[this.activeRun.value.id] = this.timerRep.value.time;
        }
      }

      resolve();
    });
  }

  /**
   * Undo the timer from being stopped.
   * @param uuid ID of team you wish to undo (if there is an active run).
   */
  undoTimer(uuid?: string): Promise<void> {
    return new Promise((resolve): void => {
      // Error if the timer is disabled.
      if (this.changesDisabled.value) {
        throw new Error('Cannot start/resume timer as changes are disabled.');
      }
      // Error if timer is not finished or running.
      if (!['finished', 'running'].includes(this.timerRep.value.state)) {
        throw new Error('Cannot undo the timer as it is not finished/running.');
      }
      // Error if there's an active run but no UUID was sent.
      if (!uuid && this.activeRun.value) {
        throw new Error('Cannot undo the timer as a run is active but no team ID was supplied.');
      }

      // If we have a UUID and an active run, remove that team's finish time.
      if (uuid && this.activeRun.value) {
        delete this.timerRep.value.teamFinishTimes[uuid];
      }

      // Undo the split if needed.
      if (this.timerRep.value.state === 'finished') {
        this.timer.undoSplit();
        this.timerRep.value.state = 'running';
        if (this.activeRun.value && this.runFinishTimes.value[this.activeRun.value.id]) {
          delete this.runFinishTimes.value[this.activeRun.value.id];
        }
      }

      resolve();
    });
  }

  /**
   * Edit the timer time.
   * @param time Time string (HH:MM:SS).
   */
  editTimer(time: string): Promise<void> {
    return new Promise((resolve): void => {
      // Error if the timer is disabled.
      if (this.changesDisabled.value) {
        throw new Error('Cannot start/resume timer as changes are disabled.');
      }
      // Error if the timer is not stopped/paused.
      if (!['stopped', 'paused'].includes(this.timerRep.value.state)) {
        throw new Error('Cannot edit the timer as it is not stopped/paused.');
      }
      // Error if the string formatting is not correct.
      if (!time.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
        throw new Error('Cannot edit the timer as the supplied string is in the incorrect format.');
      }
      const ms = timeStrToMS(time);
      this.setTime(ms);
      resolve();
    });
  }

  /**
   * This stuff runs every 1/10th a second to keep the time updated.
   */
  private tick(): void {
    if (this.timerRep.value.state === 'running') {
      // Calculates the milliseconds the timer has been running for and updates the replicant.
      const time = this.timer.currentTime().gameTime() as livesplitCore.TimeSpanRef;
      const ms = Math.floor((time.totalSeconds()) * 1000);
      this.setTime(ms);
      this.timerRep.value.timestamp = Date.now();
    }
  }

  /**
   * Set timer replicant string time and milliseconds based off a millisecond value.
   * @param ms Milliseconds you want to set the timer replicant at.
   */
  private setTime(ms: number): void {
    this.timerRep.value.time = msToTimeStr(ms);
    this.timerRep.value.milliseconds = ms;
  }

  /**
   * Set game time.
   * Game Time is used so we can edit the timer easily.
   * @param ms Milliseconds you want to set the game time at.
   */
  private setGameTime(ms: number): void {
    if (this.timerRep.value.state === 'stopped') {
      livesplitCore.TimeSpan.fromSeconds(0).with((t) => this.timer.setLoadingTimes(t));
      this.timer.initializeGameTime();
    }
    livesplitCore.TimeSpan.fromSeconds(ms / 1000).with((t) => this.timer.setGameTime(t));
  }

  /**
   * Resets timer replicant to default settings.
   * We *should* be able to just do timerRep.opts.defaultValue but it doesn't work :(
   */
  private resetTimerRepToDefault(): void {
    this.timerRep.value = {
      time: '00:00:00',
      state: 'stopped',
      milliseconds: 0,
      timestamp: 0,
      teamFinishTimes: {},
    };
  }
}
