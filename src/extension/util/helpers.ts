import { ListenForCb } from 'nodecg/types/lib/nodecg-instance'; // eslint-disable-line
import { NodeCG } from 'nodecg/types/server'; // eslint-disable-line
import { Configschema } from '../../../configschema';
import { RunData, RunDataArray } from '../../../types';

export default class Helpers {
  nodecg: NodeCG;

  constructor(nodecg: NodeCG) {
    this.nodecg = nodecg;
  }

  /**
   * Takes a run data object and returns a formed string of the player names.
   * @param runData Run Data object.
   */
  static formPlayerNamesStr(runData: RunData): string {
    return runData.teams.map((team): string => (
      team.players.map((player): string => player.name).join(', ')
    )).join(' vs. ') || 'No Player(s)';
  }

  /**
   * Takes a run data object and returns an array of all associated Twitch usernames.
   * @param runData Run Data object.
   */
  static getTwitchChannels(runData: RunData): string[] {
    const channels = runData.teams.map((team): string[] => (
      team.players
        .filter((player): boolean => !!player.social.twitch)
        .map((player): string => player.social.twitch as string)
    ));
    return ([] as string[]).concat(...channels);
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
   * Takes a variable that should be a number but may be null and
   * returns -1 if it is. If not, nothing is changed.
   * @param varToCheck Number or null that should be a number.
   */
  static nullToNegOne(varToCheck: number | null): number {
    return (varToCheck === null) ? -1 : varToCheck;
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
   * Simple helper function to handle NodeCG message acknowledgements.
   * @param err Error to supply if any.
   * @param ack The acknoledgement function itself.
   * @param data Anything else you want to send alongside.
   */
  static processAck(err: Error | boolean | null, ack?: ListenForCb, data?: unknown): void {
    if (ack && !ack.handled) {
      ack(err, data);
    }
  }

  /**
   * Simple helper function that takes a promise and processes the acknowledgement.
   * @param func Function that returns a promise.
   * @param ack NodeCG message acknowledgement.
   */
  static cgListenForHelper(func: Promise<unknown>, ack?: ListenForCb): void {
    func
      .then((): void => { Helpers.processAck(null, ack); })
      .catch((err: Error): void => { Helpers.processAck(err, ack); });
  }

  /**
   * Takes a promise and returns error and result as an array.
   * @param promise Promise you want to process.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async to(promise: Promise<any>): Promise<[Error | null, any?]> {
    try {
      const data = await promise;
      return [null, data];
    } catch (err) {
      return [err];
    }
  }

  /**
   * Returns a random integer between two values.
   * @param low Lowest number you want to return.
   * @param high Highest (but not including) number, usually an array length.
   */
  static randomInt(low: number, high: number): number {
    return Math.floor(Math.random() * (high - low) + low);
  }
}
