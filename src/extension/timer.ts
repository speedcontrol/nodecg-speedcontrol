import livesplitCore from 'livesplit-core';
import { NodeCG, Replicant } from 'nodecg/types/server'; // eslint-disable-line
import { Timer } from '../../types';
import * as nodecgApiContext from './util/nodecg-api-context';

// Cross references for LiveSplit's TimerPhases.
const LS_TIMER_PHASE = {
  NotRunning: 0,
  Running: 1,
  Ended: 2,
  Paused: 3,
};

/**
 * Checks if number needs a 0 adding to the start and does so if needed.
 * @param num Number which you want to turn into a padded string.
 */
function padTimeNumber(num: number): string {
  return num.toString().padStart(2, '0');
}

/**
 * Converts milliseconds into a time string (HH:MM:SS).
 * @param ms Milliseconds you wish to convert.
 */
function msToTimeStr(ms: number): string {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  return `${padTimeNumber(hours)}:${padTimeNumber(minutes)}:${padTimeNumber(seconds)}`;
}

export default class TimerApp {
  /* eslint-disable */
  private nodecg: NodeCG;
  private timerRep: Replicant<Timer>;
  private timer: livesplitCore.Timer;
  /* eslint-enable */

  constructor() {
    this.nodecg = nodecgApiContext.get();
    this.timerRep = this.nodecg.Replicant<Timer>('timer');

    // Sets up the timer with a single split.
    const liveSplitRun = livesplitCore.Run.new();
    liveSplitRun.pushSegment(livesplitCore.Segment.new('finish'));
    this.timer = livesplitCore.Timer.new(liveSplitRun) as livesplitCore.Timer;

    // If the timer was running when last closed, tries to resume it at the correct time.
    if (this.timerRep.value.state === 'running') {
      const missedTime = Date.now() - this.timerRep.value.timestamp;
      const previousTime = this.timerRep.value.milliseconds;
      const timeOffset = previousTime + missedTime;
      this.nodecg.log.info('Timer recovered %s seconds of lost time.', (missedTime / 1000).toFixed(2));
      this.startTimer(timeOffset);
    }

    this.nodecg.listenFor('startTimer', (): void => this.startTimer());
    this.nodecg.listenFor('pauseTimer', (): void => this.pauseTimer());
    this.nodecg.listenFor('resetTimer', (): void => this.resetTimer());
    this.nodecg.listenFor('stopTimer', (): void => this.stopTimer());
    this.nodecg.listenFor('undoStopTimer', (): void => this.undoStopTimer());

    setInterval(
      (): void => this.tick(),
      100,
    );
  }

  /**
   * Start/resume the timer, depending on the current state.
   * @param forceMS Force the timer to start with this amount of milliseconds already.
   */
  startTimer(forceMS?: number): void {
    if (!forceMS && this.timerRep.value.state !== 'stopped' && this.timerRep.value.state !== 'paused') {
      return;
    }
    if (this.timer.currentPhase() === LS_TIMER_PHASE.NotRunning) {
      this.timer.start();
      this.initGameTime(forceMS || 0);
    } else {
      this.timer.resume();
    }
    this.timerRep.value.state = 'running';
  }

  /**
   * Pause the timer.
   */
  pauseTimer(): void {
    if (this.timerRep.value.state !== 'running') {
      return;
    }
    this.timer.pause();
    this.timerRep.value.state = 'paused';
  }

  /**
   * Reset the timer.
   */
  resetTimer(): void {
    if (this.timerRep.value.state === 'stopped') {
      return;
    }
    this.timer.reset(false);
    this.resetTimerRepToDefault();
  }

  /**
   * Stop/finish the timer.
   */
  stopTimer(): void {
    if (this.timerRep.value.state !== 'running') {
      return;
    }
    this.timer.split();
    this.timerRep.value.state = 'finished';
  }

  /**
   * Undo the timer from being stopped.
   */
  undoStopTimer(): void {
    if (this.timerRep.value.state !== 'finished') {
      return;
    }
    this.timer.undoSplit();
    this.timerRep.value.state = 'running';
  }

  // This stuff runs every 1/10th a second to keep the time updated.
  private tick(): void {
    if (this.timerRep.value.state === 'running') {
      // Calculates the milliseconds the timer has been running for and updates the replicant.
      const time = this.timer.currentTime().gameTime() as livesplitCore.TimeSpanRef;
      const ms = Math.floor((time.totalSeconds()) * 1000);
      this.timerRep.value.time = msToTimeStr(ms);
      this.timerRep.value.milliseconds = ms;
      this.timerRep.value.timestamp = Date.now();
    }
  }

  // Game Time is used so we can edit the timer easily.
  /**
   * Initialise game time.
   * @param ms Milliseconds with which you want to initialise the game time at.
   */
  private initGameTime(ms: number): void {
    livesplitCore.TimeSpan.fromSeconds(0).with((t): void => this.timer.setLoadingTimes(t));
    this.timer.initializeGameTime();
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
