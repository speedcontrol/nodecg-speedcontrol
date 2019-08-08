import clone from 'clone';
import { ListenForCb } from 'nodecg/types/lib/nodecg-instance'; // eslint-disable-line
import { NodeCG, Replicant } from 'nodecg/types/server'; // eslint-disable-line
import { RunDataActiveRun, RunDataArray } from '../../types';
import * as nodecgApiContext from './util/nodecg-api-context';

let nodecg: NodeCG;

export default class RunControl {
  /* eslint-disable */
  private nodecg: NodeCG;
  private runDataArray: Replicant<RunDataArray>;
  private runDataActiveRun: Replicant<RunDataActiveRun>;
  /* eslint-enable */

  constructor() {
    nodecg = nodecgApiContext.get();
    this.nodecg = nodecg;
    this.runDataArray = this.nodecg.Replicant('runDataArray');
    this.runDataActiveRun = this.nodecg.Replicant('runDataActiveRun');

    this.nodecg.listenFor('changeActiveRun', (id: string, ack): void => this.changeActiveRun(id, ack));
    this.nodecg.listenFor('removeActiveRun', (msg: undefined, ack): void => this.removeActiveRun(ack));
  }

  /**
   * Change the active run to the one specified if it exists.
   * @param id The unique ID of the run you wish to change to.
   * @param ack Acknowledgement callback.
   */
  changeActiveRun(id: string, ack?: ListenForCb): void {
    const runData = this.runDataArray.value.find((run): boolean => run.id === id);
    let err;
    if (runData) {
      this.runDataActiveRun.value = clone(runData);
    } else {
      err = new Error(`Run with ID ${id} not found.`);
    }

    if (ack && !ack.handled) {
      ack(err);
    }
  }

  /**
   * Removes the active run from the relevant replicant.
   * @param ack Acknowledgement callback.
   */
  removeActiveRun(ack?: ListenForCb): void {
    this.runDataActiveRun.value = null;
    if (ack && !ack.handled) {
      ack(null);
    }
  }
}
