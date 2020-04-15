import _ from 'lodash';
import { ListenForCb } from 'nodecg/types/lib/nodecg-instance'; // eslint-disable-line import/no-unresolved, max-len
import { Configschema } from '../../../configschema';
import { RunData, RunDataArray, SendMessageAck } from '../../../types';
import { get } from './nodecg';

const nodecg = get();

/**
 * Takes a run data object and returns a formed string of the player names.
 * @param runData Run Data object.
 */
export function formPlayerNamesStr(runData: RunData): string {
  return runData.teams.map((team) => (
    team.players.map((player) => player.name).join(', ')
  )).join(' vs. ') || 'N/A';
}

/**
 * Takes a run data object and returns an array of all associated Twitch usernames.
 * @param runData Run Data object.
 */
export function getTwitchChannels(runData: RunData): string[] {
  const channels = runData.teams.map((team) => (
    team.players
      .filter((player) => !!player.social.twitch)
      .map((player) => player.social.twitch as string)
  ));
  return ([] as string[]).concat(...channels);
}

/**
 * Checks if number needs a 0 adding to the start and does so if needed.
 * @param num Number which you want to turn into a padded string.
 */
export function padTimeNumber(num: number): string {
  return num.toString().padStart(2, '0');
}

/**
 * Converts a time string (HH:MM:SS) into milliseconds.
 * @param time Time string you wish to convert.
 */
export function timeStrToMS(time: string): number {
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
export function msToTimeStr(ms: number): string {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  return `${padTimeNumber(hours)
  }:${padTimeNumber(minutes)
  }:${padTimeNumber(seconds)}`;
}

/**
 * Allow a script to wait for an amount of milliseconds.
 * @param ms Milliseconds to sleep for.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Attempt to find a run in the run data array from it's ID.
 * @param id Unique ID of the run you want to attempt to find in the run data array.
 */
export function findRunIndexFromId(id?: string): number {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore: readReplicant not in NodeCGServer typings
  const arr = nodecg.readReplicant('runDataArray') as RunDataArray;
  return arr.findIndex((run) => run.id === id);
}

/**
 * Returns this bundle's configuration along with the correct typings.
 */
export function bundleConfig(): Configschema {
  return nodecg.bundleConfig;
}

/**
 * Simple helper function to handle NodeCG/our message acknowledgements.
 * @param ack The acknoledgement function itself.
 * @param err Error to supply if any.
 * @param data Anything else you want to send alongside.
 */
export function processAck<T>(
  ack: ListenForCb | SendMessageAck | undefined,
  err: Error | null,
  data?: T,
): void {
  if (ack && !ack.handled) {
    ack(err, data);
  }
}

/**
 * Takes a promise and returns error and result as an array.
 * @param promise Promise you want to process.
 */
export async function to<T>(promise: Promise<T>): Promise<[Error | null, T?]> {
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
export function randomInt(low: number, high: number): number {
  return Math.floor(Math.random() * (high - low) + low);
}

/**
 * Checks if the game name appears in the ignore list in the configuration.
 * @param game Game string (or null) to check against.
 */
export function checkGameAgainstIgnoreList(game: string | null): boolean {
  if (!game) {
    return false;
  }
  const list = bundleConfig().schedule.ignoreGamesWhileImporting || [];
  return !!list.find((str) => !!str.toLowerCase().match(
    new RegExp(`\\b${_.escapeRegExp(game.toLowerCase())}\\b`),
  ));
}

/**
 * Will attempt to extract the Twitch username from a Twitch URL if possible.
 */
export function getTwitchUserFromURL(url?: string): string | undefined {
  const sanitised = url?.endsWith('/') ? url.substring(0, url.length - 1) : url;
  return sanitised && sanitised.includes('twitch.tv')
    ? sanitised.split('/')[sanitised.split('/').length - 1] : undefined;
}
