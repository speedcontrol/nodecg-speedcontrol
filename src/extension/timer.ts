import livesplitCore from 'livesplit-core';
import { ListenForCb } from 'nodecg/types/lib/nodecg-instance'; // eslint-disable-line
import { NodeCG, Replicant } from 'nodecg/types/server'; // eslint-disable-line
import { Timer } from '../../types';
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
  /* eslint-disable */
  private nodecg: NodeCG;
  private timerRep: Replicant<Timer>;
  private timer: livesplitCore.Timer;
  /* eslint-enable */

  constructor(nodecg: NodeCG) {
    this.nodecg = nodecg;
    this.timerRep = this.nodecg.Replicant('timer');

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
      this.nodecg.log.info('Timer recovered %s seconds of lost time.', (missedTime / 1000).toFixed(2));
      this.startTimer(true);
    }

    this.nodecg.listenFor('startTimer', (msg, ack): void => this.startTimer(false, ack));
    this.nodecg.listenFor('pauseTimer', (msg, ack): void => this.pauseTimer(ack));
    this.nodecg.listenFor('resetTimer', (msg, ack): void => this.resetTimer(ack));
    this.nodecg.listenFor('stopTimer', (msg, ack): void => this.stopTimer(ack));
    this.nodecg.listenFor('undoStopTimer', (msg, ack): void => this.undoStopTimer(ack));
    this.nodecg.listenFor('editTimer', (time, ack): void => this.editTimer(time, ack));

    setInterval(
      (): void => this.tick(),
      100,
    );
  }

  /**
   * Start/resume the timer, depending on the current state.
   * @param forceMS Force the timer to start with this amount of milliseconds already.
   */
  startTimer(force?: boolean, ack?: ListenForCb): void {
    if (!force && !['stopped', 'paused'].includes(this.timerRep.value.state)) {
      processAck(true, ack);
      return;
    }

    if (this.timer.currentPhase() === LS_TIMER_PHASE.NotRunning) {
      this.timer.start();
    } else {
      this.timer.resume();
    }
    this.setGameTime(this.timerRep.value.milliseconds);
    this.timerRep.value.state = 'running';
    processAck(null, ack);
  }

  /**
   * Pause the timer.
   */
  pauseTimer(ack?: ListenForCb): void {
    if (this.timerRep.value.state !== 'running') {
      processAck(true, ack);
      return;
    }
    this.timer.pause();
    this.timerRep.value.state = 'paused';
    processAck(null, ack);
  }

  /**
   * Reset the timer.
   */
  resetTimer(ack?: ListenForCb): void {
    if (this.timerRep.value.state === 'stopped') {
      processAck(true, ack);
      return;
    }
    this.timer.reset(false);
    this.resetTimerRepToDefault();
    processAck(null, ack);
  }

  /**
   * Stop/finish the timer.
   */
  stopTimer(ack?: ListenForCb): void {
    if (this.timerRep.value.state !== 'running') {
      processAck(true, ack);
      return;
    }
    this.timer.split();
    this.timerRep.value.state = 'finished';
    processAck(null, ack);
  }

  /**
   * Undo the timer from being stopped.
   */
  undoStopTimer(ack?: ListenForCb): void {
    if (this.timerRep.value.state !== 'finished') {
      processAck(true, ack);
      return;
    }
    this.timer.undoSplit();
    this.timerRep.value.state = 'running';
    processAck(null, ack);
  }

  /**
   * Edit the timer time (if stopped/paused).
   * @param time Time string (HH:MM:SS).
   */
  editTimer(time: string, ack?: ListenForCb): void {
    // Check to see if the time was given in the correct format and if it's stopped/paused.
    if ((['stopped', 'paused'].includes(this.timerRep.value.state))
    && time.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
      const ms = timeStrToMS(time);
      this.setTime(ms);
      processAck(null, ack);
    } else {
      processAck(true, ack);
    }
  }

  // This stuff runs every 1/10th a second to keep the time updated.
  private tick(): void {
    if (this.timerRep.value.state === 'running') {
      // Calculates the milliseconds the timer has been running for and updates the replicant.
      const time = this.timer.currentTime().gameTime() as livesplitCore.TimeSpanRef;
      const ms = Math.floor((time.totalSeconds()) * 1000);
      this.setTime(ms);
      this.timerRep.value.timestamp = Date.now();
    }
  }

  private setTime(ms: number): void {
    this.timerRep.value.time = msToTimeStr(ms);
    this.timerRep.value.milliseconds = ms;
  }

  // Game Time is used so we can edit the timer easily.
  /**
   * Set game time.
   * @param ms Milliseconds with which you want to set the game time at.
   */
  private setGameTime(ms: number): void {
    if (this.timerRep.value.state === 'stopped') {
      livesplitCore.TimeSpan.fromSeconds(0).with((t): void => this.timer.setLoadingTimes(t));
      this.timer.initializeGameTime();
    }
    livesplitCore.TimeSpan.fromSeconds(ms / 1000).with((t): void => this.timer.setGameTime(t));
  }

  // Resets timer replicant to default settings.
  // We *should* be able to just do timerRep.opts.defaultValue but it doesn't work :(
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
