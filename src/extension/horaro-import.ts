import crypto from 'crypto';
import _ from 'lodash';
import MarkdownIt from 'markdown-it';
import needle from 'needle';
import { mapSeries } from 'p-iteration';
import parseDuration from 'parse-duration';
import removeMd from 'remove-markdown';
import uuid from 'uuid/v4';
import { DefaultSetupTime, HoraroImportStatus } from '../../schemas';
import { RunData, RunDataArray, RunDataPlayer, RunDataTeam, UserData } from '../../types'; // eslint-disable-line
import * as events from './util/events';
import * as h from './util/helpers';
import { get } from './util/nodecg';

const {
  msToTimeStr,
  nullToUndefined,
  nullToNegOne,
  sleep,
  processAck,
} = h;
const nodecg = get();

interface ParsedMarkdown {
  url?: string;
  str?: string;
}

// Some really simple typings for the schedule data.
interface HoraroSchedule {
  schedule: {
    setup_t: number;
    items: HoraroScheduleItem[];
  };
}

interface HoraroScheduleItem {
  length: string;
  length_t: number;
  scheduled: string;
  scheduled_t: number;
  data: (string | null)[];
  options?: {
    setup?: string;
  };
}

interface ImportOptions {
  columns: {
    game: number;
    gameTwitch: number;
    category: number;
    system: number;
    region: number;
    release: number;
    player: number;
    custom: {
      [k: string]: number;
    };
  };
  split: 0 | 1;
}

const runDataArray = nodecg.Replicant<RunDataArray>('runDataArray');
const config = h.bundleConfig();
const md = new MarkdownIt();
const importStatus = nodecg.Replicant<HoraroImportStatus>('horaroImportStatus', {
  persistent: false,
});
const defaultSetupTime = nodecg.Replicant<DefaultSetupTime>('defaultSetupTime');
const scheduleDataCache: { [k: string]: HoraroSchedule } = {};

/**
 * Used to parse Markdown from schedules.
 * Currently returns URL of first link and a string with all formatting removed.
 * Will return both undefined if nothing is supplied.
 * @param str Markdowned string you wish to parse.
 */
function parseMarkdown(str?: string): ParsedMarkdown {
  const results: ParsedMarkdown = {};
  if (!str) {
    return results;
  }
  // Some stuff can break this, so try/catching it if needed.
  try {
    const res = md.parseInline(str, {});
    const url = res[0].children.find((child): boolean => (
      child.type === 'link_open' && child.attrs[0] && child.attrs[0][0] === 'href'
    ));
    results.url = (url) ? url.attrs[0][1] : undefined;
    results.str = removeMd(str);
    return results;
  } catch (err) {
    return results;
  }
}

/**
 * Used to look up a user's data on speedrun.com with an arbitrary string,
 * usually name or Twitch username. If nothing is specified, will resolve immediately.
 * @param str String to attempt to look up the user by.
 */
function querySRcomUserData(str?: string): Promise<UserData> {
  return new Promise(async (resolve): Promise<void> => {
    if (!str || config.schedule.disableSpeedrunComLookup) {
      resolve();
    } else {
      try {
        await sleep(1000); // this slows it down even if it's in cache, needs fixing
        const data = await events.sendMessage('srcomUserSearch', str);
        resolve(data);
      } catch (err) {
        resolve(); // If nothing found, currently just resolve.
      }
    }
  });
}

/**
 * Attempt to get information about a player using several options.
 * @param name Name to attempt to use.
 * @param twitchURL Twitch URL to attempt to use.
 */
function parseSRcomUserData(name?: string, twitchURL?: string): Promise<{
  country?: string;
  twitchURL?: string;
}> {
  return new Promise(async (resolve): Promise<void> => {
    const foundData: {
      country?: string;
      twitchURL?: string;
    } = {};

    // Get username from Twitch URL.
    const twitchUsername = (
      twitchURL && twitchURL.includes('twitch.tv')
    ) ? twitchURL.split('/')[twitchURL.split('/').length - 1] : undefined;

    // First query using Twitch username, then normal name if needed.
    let data = await querySRcomUserData(twitchUsername);
    if (!data) {
      data = await querySRcomUserData(name);
    }

    // Parse data if possible.
    if (data) {
      foundData.country = (data.location) ? data.location.country.code : undefined;
      foundData.twitchURL = (data.twitch && data.twitch.uri) ? data.twitch.uri : undefined;
    }

    resolve(foundData);
  });
}

/**
 * Generates a hash based on the contents of the string based run data from Horaro.
 * @param colData Array of strings (or nulls), obtained from the Horaro JSON data.
 */
function generateRunHash(colData: (string | null)[]): string {
  return crypto.createHash('sha1').update(colData.join(), 'utf8').digest('hex');
}

/**
 * Checks if the game name appears in the ignore list in the configuration.
 * @param game Game string (or null) to check against.
 */
function checkGameAgainstIgnoreList(game: string | null): boolean {
  if (!game) {
    return false;
  }
  const list = config.schedule.ignoreGamesWhileImporting || [];
  return !!list.find((str): boolean => !!str.toLowerCase().match(
    new RegExp(`\\b${_.escapeRegExp(game.toLowerCase())}\\b`),
  ));
}

/**
 * Resets the replicant's values to default.
 */
function resetImportStatus(): void {
  importStatus.value.importing = false;
  importStatus.value.item = 0;
  importStatus.value.total = 0;
}

/**
 * Load schedule data in from Horaro, store in a temporary cache and return it.
 * @param url URL of Horaro schedule.
 * @param dashUUID UUID of dashboard element, generated on panel load and passed here.
 */
function loadSchedule(url: string, dashUUID: string): Promise<HoraroSchedule> {
  return new Promise(async (resolve, reject): Promise<void> => {
    try {
      let jsonURL = `${url}.json`;
      if (url.match((/\?key=/))) { // If schedule URL has a key in it, extract it correctly.
        const urlMatch = (url.match(/(.*?)(?=(\?key=))/) as RegExpMatchArray)[0];
        const keyMatch = (url.match(/(?<=(\?key=))(.*?)$/) as RegExpMatchArray)[0];
        jsonURL = `${urlMatch}.json?key=${keyMatch}`;
      }
      const resp = await needle('get', encodeURI(jsonURL));
      if (resp.statusCode !== 200) {
        throw new Error('Cannot load schedule as HTTP status code was not 200.');
      }
      scheduleDataCache[dashUUID] = resp.body;
      resolve(resp.body);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Imports schedule data loaded in above function.
 * @param opts Options on how the schedule data should be parsed, including column numbers.
 * @param dashUUID UUID of dashboard element, generated on panel load and passed here.
 */
function importSchedule(opts: ImportOptions, dashUUID: string): Promise<RunDataArray> {
  return new Promise(async (resolve, reject): Promise<void> => {
    try {
      importStatus.value.importing = true;
      const data = scheduleDataCache[dashUUID];
      const runItems = data.schedule.items;
      const setupTime = data.schedule.setup_t;
      defaultSetupTime.value = setupTime;

      // Filtering out any games on the ignore list before processing them all.
      const newRunDataArray = await mapSeries(runItems.filter((run): boolean => (
        !checkGameAgainstIgnoreList(run.data[nullToNegOne(opts.columns.game)])
      )), async (run, index, arr): Promise<RunData> => {
        importStatus.value.item = index + 1;
        importStatus.value.total = arr.length;

        // If a run with the same hash exists already, assume it's the same and use the same UUID.
        const hash = generateRunHash(run.data);
        const matchingOldRun = runDataArray.value.find(
          (oldRun): boolean => oldRun.hash === hash,
        );
        const runData: RunData = {
          teams: [],
          customData: {},
          id: (matchingOldRun) ? matchingOldRun.id : uuid(),
          hash,
        };

        // General Run Data
        const generalDataList = ['game', 'gameTwitch', 'system', 'category', 'region', 'release'];
        generalDataList.forEach((type) => {
          // @ts-ignore: double check the list above and make sure they are on RunData!
          runData[type] = parseMarkdown(
            nullToUndefined(
              run.data[
                nullToNegOne(
                  // @ts-ignore: same as above
                  opts.columns[type],
                )
              ],
            ),
          ).str;
        });

        // Scheduled Date/Time
        runData.scheduledS = run.scheduled_t;
        runData.scheduled = run.scheduled;

        // Estimate
        runData.estimateS = run.length_t;
        runData.estimate = msToTimeStr(run.length_t * 1000);

        // Setup Time
        let runSetupTime = setupTime * 1000;
        if (run.options && run.options.setup) {
          const duration = parseDuration(run.options.setup);
          if (duration > 0) {
            runSetupTime = duration;
          }
        }
        runData.setupTime = msToTimeStr(runSetupTime);
        runData.setupTimeS = runSetupTime / 1000;

        // Custom Data
        Object.keys(opts.columns.custom).forEach((col) => {
          const { str } = parseMarkdown(
            nullToUndefined(
              run.data[
                nullToNegOne(
                  opts.columns.custom[col],
                )
              ],
            ),
          );
          if (str) {
            runData.customData[col] = str;
          }
        });

        // Players
        // (do we need this if? I like it for organisation at least)
        if (run.data[nullToNegOne(opts.columns.player)]) {
          const playerList: string = nullToUndefined(run.data[nullToNegOne(opts.columns.player)]);

          // Mapping team string into something more manageable.
          const teamSplittingRegex = [
            /\s+vs\.?\s+/, // vs/vs.
            /\s*,\s*/, // Comma (,)
          ];
          const teamsRaw = await mapSeries(
            playerList.split(teamSplittingRegex[opts.split]),
            (team): { name?: string; players: string[] } => {
              const nameMatch = team.match(/^(.+)(?=:\s)/);
              return {
                name: (nameMatch) ? nameMatch[0] : undefined,
                players: (opts.split === 0)
                  ? team.replace(/^(.+)(:\s)/, '').split(/\s*,\s*/)
                  : [team.replace(/^(.+)(:\s)/, '')],
              };
            },
          );

          // Mapping team information from above into needed format.
          runData.teams = await mapSeries(
            teamsRaw,
            async (rawTeam): Promise<RunDataTeam> => {
              const team: RunDataTeam = {
                id: uuid(),
                name: parseMarkdown(rawTeam.name).str,
                players: [],
              };

              // Mapping player information into needed format.
              team.players = await mapSeries(
                rawTeam.players,
                async (rawPlayer): Promise<RunDataPlayer> => {
                  const { str, url } = parseMarkdown(rawPlayer);
                  const { country, twitchURL } = await parseSRcomUserData(str, url);
                  const usedURL = url || twitchURL; // Always favour URL from Horaro.
                  return {
                    name: str || '',
                    id: uuid(),
                    teamID: team.id,
                    country,
                    social: {
                      twitch: (
                        usedURL && usedURL.includes('twitch.tv')
                      ) ? usedURL.split('/')[usedURL.split('/').length - 1] : undefined,
                    },
                  };
                },
              );

              return team;
            },
          );
        }

        nodecg.log.debug(
          'Horaro Schedule Import: Successfully imported %s/%s.',
          index + 1,
          runItems.length,
        );
        return runData;
      });

      runDataArray.value = newRunDataArray;
      resetImportStatus();
      resolve();
    } catch (err) {
      resetImportStatus();
      reject(err);
    }
  });
}

nodecg.listenFor('loadSchedule', (opts: {
  url: string;
  dashUUID: string;
}, ack) => {
  loadSchedule(opts.url, opts.dashUUID).then((data) => {
    processAck(null, ack, data);
  }).catch((err) => {
    processAck(err, ack);
  });
});

nodecg.listenFor('importSchedule', (opts: {
  opts: ImportOptions;
  dashUUID: string;
}, ack) => {
  try {
    if (importStatus.value.importing) {
      throw new Error('Cannot import schedule as a schedule is already being imported.');
    }
    nodecg.log.info('Started importing Horaro schedule.');
    importSchedule(opts.opts, opts.dashUUID).then(() => {
      nodecg.log.info('Successfully imported Horaro schedule.');
      processAck(null, ack);
    }).catch((err) => {
      throw err;
    });
  } catch (err) {
    nodecg.log.warn('Error importing Horaro schedule:', err);
    processAck(err, ack);
  }
});
