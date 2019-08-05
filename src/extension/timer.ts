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

function padTimeNumber(num: number): string {
  return num.toString().padStart(2, '0');
}

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

  startTimer(): void {
    if (this.timerRep.value.state !== 'stopped' && this.timerRep.value.state !== 'paused') {
      return;
    }
    if (this.timer.currentPhase() === LS_TIMER_PHASE.NotRunning) {
      this.timer.start();
    } else {
      this.timer.resume();
    }
    this.timerRep.value.state = 'running';
  }

  pauseTimer(): void {
    if (this.timerRep.value.state !== 'running') {
      return;
    }
    this.timer.pause();
    this.timerRep.value.state = 'paused';
  }

  resetTimer(): void {
    if (this.timerRep.value.state === 'stopped') {
      return;
    }
    this.timer.reset(false);
    this.resetTimerRepToDefault();
  }

  stopTimer(): void {
    if (this.timerRep.value.state !== 'running') {
      return;
    }
    this.timer.split();
    this.timerRep.value.state = 'finished';
  }

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
      const time = this.timer.currentTime().realTime() as livesplitCore.TimeSpanRef;
      const ms = Math.floor((time.totalSeconds()) * 1000);
      this.timerRep.value.time = msToTimeStr(ms);
      this.timerRep.value.milliseconds = ms;
      this.timerRep.value.timestamp = Date.now();
    }
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
