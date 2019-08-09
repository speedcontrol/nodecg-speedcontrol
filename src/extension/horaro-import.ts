import crypto from 'crypto';
import MarkdownIt from 'markdown-it';
import needle from 'needle';
import { NodeCG, Replicant } from 'nodecg/types/server'; // eslint-disable-line
import { mapSeries } from 'p-iteration';
import removeMd from 'remove-markdown';
import uuid from 'uuid/v4';
import { Configschema } from '../../configschema';
import { RunData, RunDataArray, RunDataPlayer, RunDataTeam } from '../../types'; // eslint-disable-line
import Helpers from './util/helpers';

const { msToTimeStr, nullToUndefined, sleep } = Helpers;
const md = new MarkdownIt();
let nodecg: NodeCG;
let config: Configschema;
let runDataArray: Replicant<RunDataArray>;
const userDataCache: {
  [k: string]: SRcomUserData;
} = {};

interface ParsedMarkdown {
  url?: string;
  str?: string;
}

interface HoraroScheduleItem {
  length: string;
  length_t: number;
  scheduled: string;
  scheduled_t: number;
  data: (string | null)[];
  options: {
    setup?: string;
  };
}

interface ColumnsOptions {
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
}

/**
 * Not everything but the relevant things for us in this file.
 */
interface SRcomUserData {
  location: {
    country: {
      code: string;
    };
  } | null;
  twitch: {
    uri: string;
  } | null;
}

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
function querySRcomUserData(str?: string): Promise<SRcomUserData> {
  return new Promise(async (resolve): Promise<void> => {
    if (!str || config.schedule.disableSpeedrunComLookup) {
      resolve();
    } else if (userDataCache[str]) {
      resolve(userDataCache[str]);
    } else {
      let success = true;
      do {
        try {
          /* eslint-disable-next-line */
          const resp = await needle(
            'get',
            encodeURI(`https://www.speedrun.com/api/v1/users?max=1&lookup=${str.toLowerCase()}`),
          );
          await sleep(1000); // eslint-disable-line
          // @ts-ignore: parser exists but isn't in the typings
          if (resp.parser === 'json') {
            [userDataCache[str]] = resp.body.data; // Simple temporary cache storage.
            resolve(resp.body.data[0]);
          } else {
            resolve();
          }
        } catch (err) {
          success = false;
        }
      } while (!success);
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
    new RegExp(`\\b${game.toLowerCase()}\\b`),
  ));
}

function parseSchedule(): Promise<RunDataArray> {
  return new Promise(async (resolve, reject): Promise<void> => {
    try {
      // Needs to be assigned somewhere else.
      const columns: ColumnsOptions = {
        game: 0,
        gameTwitch: -1,
        category: 3,
        system: 2,
        region: -1,
        release: -1,
        player: 1,
        custom: {
          layout: 5,
        },
      };

      if (!config.schedule.defaultURL) {
        throw new Error('Schedule URL is not defined.');
      }
      const resp = await needle('get', config.schedule.defaultURL);
      const runItems: HoraroScheduleItem[] = resp.body.schedule.items;
      const defaultSetupTime: number = resp.body.schedule.setup_t;

      // Filtering out any games on the ignore list before processing them all.
      const newRunDataArray = await mapSeries(runItems.filter((run): boolean => (
        !checkGameAgainstIgnoreList(run.data[columns.game])
      )), async (run, index): Promise<RunData> => {
        // If a run with the same hash exists already, assume it's the same and use the same UUID.
        const hash = generateRunHash(run.data);
        const matchingOldRun = runDataArray.value.find((oldRun): boolean => oldRun.hash === hash);
        const runData: RunData = {
          teams: [],
          customData: {},
          id: (matchingOldRun) ? matchingOldRun.id : uuid(),
          hash,
        };

        // General Run Data
        const generalDataList = ['game', 'gameTwitch', 'system', 'category', 'region', 'release'];
        generalDataList.forEach((type): void => {
          // @ts-ignore: double check the list above and make sure they are on RunData!
          runData[type] = parseMarkdown(nullToUndefined(run.data[columns[type]])).str;
        });

        // Scheduled Date/Time
        runData.scheduledS = run.scheduled_t;
        runData.scheduled = run.scheduled;

        // Estimate
        runData.estimateS = run.length_t;
        runData.estimate = msToTimeStr(run.length_t * 1000);

        // Setup Time
        // (need to do custom setup times here as well)
        runData.setupTime = msToTimeStr(defaultSetupTime * 1000);
        runData.setupTimeS = defaultSetupTime;

        // Custom Data
        Object.keys(columns.custom).forEach((col): void => {
          const { str } = parseMarkdown(nullToUndefined(run.data[columns.custom[col]]));
          if (str) {
            runData.customData[col] = str;
          }
        });

        // Players
        // (do we need this if? I like it for organisation at least)
        if (run.data[columns.player]) {
          const playerList: string = nullToUndefined(run.data[columns.player]) || '';

          // Mapping team string into something more manageable.
          // vs/vs.
          const teamsRaw = await mapSeries(
            playerList.split(/\s+vs\.?\s+/),
            (team): { name?: string; players: string[] } => {
              const nameMatch = team.match(/^(.+)(?=:\s)/);
              return {
                name: (nameMatch) ? nameMatch[0] : undefined,
                players: team.replace(/^(.+)(:\s)/, '').split(/\s*,\s*/),
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

        nodecg.log.debug('Horaro Schedule Import: Successfully imported %s/%s.', index + 1, runItems.length);
        return runData;
      });

      resolve(newRunDataArray);
    } catch (err) {
      reject(err);
    }
  });
}

export default class HoraroImport {
  /* eslint-disable */
  private nodecg: NodeCG;
  private h: Helpers;
  private runDataArray: Replicant<RunDataArray>;
  /* eslint-enable */

  constructor(nodecg_: NodeCG) {
    nodecg = nodecg_;
    this.nodecg = nodecg;
    this.h = new Helpers(nodecg_);
    config = this.h.bundleConfig();
    runDataArray = this.nodecg.Replicant('runDataArray');
    this.runDataArray = runDataArray;

    this.nodecg.listenFor('importSchedule', (): void => {
      this.nodecg.log.info('Starting import of Horaro schedule.');
      parseSchedule().then((runs): void => {
        this.runDataArray.value = runs;
        this.nodecg.log.info('Successfully imported Horaro schedule.');
      }).catch((err: Error): void => {
        this.nodecg.log.warn('Error importing Horaro schedule:', err);
      });
    });
  }
}
