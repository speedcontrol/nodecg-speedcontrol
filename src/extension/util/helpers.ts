import { ListenForCb } from 'nodecg/types/lib/nodecg-instance'; // eslint-disable-line
import { NodeCG } from 'nodecg/types/server'; // eslint-disable-line
import { Configschema } from '../../../configschema';
import { RunDataArray } from '../../../types';

export default class Helpers {
  private nodecg: NodeCG;

  constructor(nodecg: NodeCG) {
    this.nodecg = nodecg;
  }

  /**
   * Checks if number needs a 0 adding to the start and does so if needed.
   * @param num Number which you want to turn into a padded string.
   */
  static padTimeNumber(num: number): string {
    return num.toString().padStart(2, '0');
  }

  /**
   * Converts a time string (HH:MM:SS) into milliseconds.
   * @param time Time string you wish to convert.
   */
  static timeStrToMS(time: string): number {
    const ts = time.split(':');
    if (ts.length === 2) {
      ts.unshift('00'); // Adds 0 hours if they are not specified.
    }
    return Date.UTC(1970, 0, 1, Number(ts[0]), Number(ts[1]), Number(ts[2]));
  }

  /**
   * Converts milliseconds into a time string (HH:MM:SS).
   * @param ms Milliseconds you wish to convert.
   */
  static msToTimeStr(ms: number): string {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return `${Helpers.padTimeNumber(hours)}:${Helpers.padTimeNumber(minutes)}:${Helpers.padTimeNumber(seconds)}`;
  }

  /**
   * Takes a variable that may be null and returns undefined if it is. If not, nothing is changed.
   * @param varToCheck Variable to check that may be null.
   */
  // eslint-disable-next-line
  static nullToUndefined(varToCheck: any): any {
    return (varToCheck === null) ? undefined : varToCheck;
  }

  /**
   * Allow a script to wait for an amount of milliseconds.
   * @param ms Milliseconds to sleep for.
   */
  static sleep(ms: number): Promise<void> {
    return new Promise((resolve): void => {
      setTimeout(resolve, ms);
    });
  }

  /**
   * Attempt to find a run in the run data array from it's ID.
   * @param id Unique ID of the run you want to attempt to find in the run data array.
   */
  findRunIndexFromId(id?: string): number {
    // @ts-ignore: readReplicant not in NodeCGServer typings
    const arr: RunDataArray = this.nodecg.readReplicant('runDataArray');
    return arr.findIndex((run): boolean => run.id === id);
  }

  /**
   * Returns this bundle's configuration along with the correct typings.
   */
  bundleConfig(): Configschema {
    return this.nodecg.bundleConfig;
  }

  /**
   * Simple helper function to handle NodeCG message acknoledgements.
   * @param err Error to supply if any.
   * @param ack The acknoledgement function itself.
   * @param msg Anything else you want to send alongside.
   */
  static processAck(err: Error | boolean | null, ack?: ListenForCb, msg?: unknown): void {
    if (ack && !ack.handled) {
      ack(err, msg);
    }
  }
}
