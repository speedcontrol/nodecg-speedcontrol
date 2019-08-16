import clone from 'clone';
import { ListenForCb } from 'nodecg/types/lib/nodecg-instance'; // eslint-disable-line
import { NodeCG, Replicant } from 'nodecg/types/server'; // eslint-disable-line
import { RunDataActiveRunSurrounding } from '../../schemas';
import { RunData, RunDataActiveRun, RunDataArray, Timer } from '../../types'; // eslint-disable-line
import Helpers from './util/helpers';

const { processAck, timeStrToMS, msToTimeStr } = Helpers;

export default class RunControl {
  /* eslint-disable */
  private nodecg: NodeCG;
  private h: Helpers;
  private array: Replicant<RunDataArray>;
  private activeRun: Replicant<RunDataActiveRun>;
  private activeRunSurrounding: Replicant<RunDataActiveRunSurrounding>;
  private timer: Replicant<Timer>;
  /* eslint-enable */

  constructor(nodecg: NodeCG) {
    this.nodecg = nodecg;
    this.h = new Helpers(nodecg);
    this.array = this.nodecg.Replicant('runDataArray');
    this.activeRun = this.nodecg.Replicant('runDataActiveRun');
    this.activeRunSurrounding = this.nodecg.Replicant('runDataActiveRunSurrounding');
    this.timer = this.nodecg.Replicant('timer');

    this.nodecg.listenFor('changeActiveRun', (id: string, ack): void => this.changeActiveRun(id, ack));
    this.nodecg.listenFor('removeRun', (id: string, ack): void => this.removeRun(id, ack));
    this.nodecg.listenFor('modifyRun', (data, ack): void => this.modifyRun(data, ack));
    this.nodecg.listenFor('changeToNextRun', (msg, ack): void => (
      this.changeActiveRun(this.activeRunSurrounding.value.next, ack)
    ));
    this.nodecg.listenFor('returnToStart', (msg, ack): void => this.removeActiveRun(ack));
    this.nodecg.listenFor('removeAllRuns', (msg, ack): void => this.removeAllRuns(ack));

    this.activeRun.on('change', (): void => this.changeSurroundingRuns());
    this.array.on('change', (): void => this.changeSurroundingRuns());
  }

  /**
   * Used to update the replicant that stores ID references to previous/current/next runs.
   */
  changeSurroundingRuns(): void {
    let previous: RunData | undefined;
    let current: RunData | undefined;
    let next: RunData | undefined;

    if (!this.activeRun.value) {
      // No current run set, we must be at the start, only set that one.
      [next] = this.array.value;
    } else {
      current = this.activeRun.value; // Current will always be the active one.

      // Try to find currently set runs in the run data array.
      const currentIndex = this.h.findRunIndexFromId(current.id);
      const previousIndex = this.h.findRunIndexFromId(this.activeRunSurrounding.value.previous);
      const nextIndex = this.h.findRunIndexFromId(this.activeRunSurrounding.value.next);

      if (currentIndex >= 0) { // Found current run in array.
        if (currentIndex > 0) {
          [previous,, next] = this.array.value.slice(currentIndex - 1);
        } else { // We're at the start and can't splice -1.
          [, next] = this.array.value.slice(0);
        }
      } else if (previousIndex >= 0) { // Found previous run in array, use for reference.
        [previous,, next] = this.array.value.slice(previousIndex);
      } else if (nextIndex >= 0) { // Found next run in array, use for reference.
        [previous,, next] = this.array.value.slice(nextIndex - 2);
      }
    }

    this.activeRunSurrounding.value = {
      previous: (previous) ? previous.id : undefined,
      current: (current) ? current.id : undefined,
      next: (next) ? next.id : undefined,
    };
  }

  /**
   * Change the active run to the one specified if it exists.
   * @param id The unique ID of the run you wish to change to.
   * @param ack NodeCG message acknowledgement.
   */
  changeActiveRun(id?: string, ack?: ListenForCb): void {
    const runData = this.array.value.find((run): boolean => run.id === id);
    let err: Error | null = null;
    if (['running', 'paused'].includes(this.timer.value.state)) {
      err = new Error('Cannot change run while timer is running/paused.');
    } else if (runData) {
      this.activeRun.value = clone(runData);
      this.nodecg.sendMessage('resetTimer');
    } else if (!id) {
      err = new Error('Cannot change run as no run ID was supplied.');
    } else {
      err = new Error(`Cannot change run as a run with ID ${id} was not found.`);
    }
    processAck(err, ack);
  }

  /**
   * Deletes a run from the run data array.
   * @param id The unique ID of the run you wish to delete.
   * @param ack NodeCG message acknowledgement.
   */
  removeRun(id?: string, ack?: ListenForCb): void {
    const runIndex = this.array.value.findIndex((run): boolean => run.id === id);
    let err: Error | null = null;
    if (runIndex >= 0) {
      this.array.value.splice(runIndex, 1);
    } else if (!id) {
      err = new Error('Cannot delete run as no run ID was supplied.');
    } else {
      err = new Error(`Cannot delete run as a run with ID ${id} was not found.`);
    }
    processAck(err, ack);
  }

  /**
   * Either edits a run (if we currently have it) or adds it.
   * @param runData Run Data object.
   * @param ack NodeCG message acknowledgement.
   */
  modifyRun(runData: RunData, ack?: ListenForCb): void {
    const data = runData;
    // Verify and convert estimate.
    if (data.estimate && data.estimate.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
      const ms = timeStrToMS(data.estimate);
      data.estimate = msToTimeStr(ms);
      data.estimateS = ms / 1000;
    } else {
      delete data.estimate;
      delete data.estimateS;
    }

    // Verify and convert setup time.
    if (data.setupTime && data.setupTime.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
      const ms = timeStrToMS(data.setupTime);
      data.setupTime = msToTimeStr(ms);
      data.setupTimeS = ms / 1000;
    } else {
      delete data.setupTime;
      delete data.setupTimeS;
    }

    const index = this.h.findRunIndexFromId(runData.id);
    if (index >= 0) { // Run already exists, edit it.
      this.array.value[index] = runData;
      // update the active run as well? maybe prompt user if nessecary
    } else { // Run is new, add it.
      this.array.value.push(runData);
    }
    processAck(null, ack);
  }

  /**
   * Removes the active run from the relevant replicant.
   * @param ack NodeCG message acknowledgement.
   */
  removeActiveRun(ack?: ListenForCb): void {
    let err: Error | null = null;
    if (['running', 'paused'].includes(this.timer.value.state)) {
      err = new Error('Cannot change run while timer is running/paused.');
    } else {
      this.activeRun.value = null;
      this.nodecg.sendMessage('resetTimer');
    }
    processAck(err, ack);
  }

  /**
   * Removes all runs in the array and the currently active run.
   * @param ack NodeCG message acknowledgement.
   */
  removeAllRuns(ack?: ListenForCb): void {
    let err: Error | null = null;
    if (['running', 'paused'].includes(this.timer.value.state)) {
      err = new Error('Cannot remove all runs while timer is running/paused.');
    } else {
      this.array.value.length = 0;
      this.removeActiveRun();
      this.nodecg.sendMessage('resetTimer');
    }
    processAck(err, ack);
  }
}
