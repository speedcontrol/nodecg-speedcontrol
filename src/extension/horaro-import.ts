import MarkdownIt from 'markdown-it';
import needle from 'needle';
import { NodeCG, Replicant } from 'nodecg/types/server'; // eslint-disable-line
import { mapSeries } from 'p-iteration';
import removeMd from 'remove-markdown';
import uuid from 'uuid/v4';
import { RunData, RunDataArray, RunDataPlayer, RunDataTeam } from '../../types'; // eslint-disable-line
import { msToTimeStr, nullToUndefined, sleep } from './util/helpers';
import * as nodecgApiContext from './util/nodecg-api-context';

const md = new MarkdownIt();

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
  return new Promise(async (resolve, reject): Promise<void> => {
    if (!str) {
      resolve();
    } else {
      try {
        const resp = await needle(
          'get',
          encodeURI(`https://www.speedrun.com/api/v1/users?max=1&lookup=${str.toLowerCase()}`),
        );
        // needs checks to see if this data is valid before trying to parse it/return it
        resolve(resp.body.data[0]);
      } catch (err) {
        // needs some retrying logic in here
        reject();
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

    await sleep(1000);
    resolve(foundData);
  });
}

function parseSchedule(): Promise<RunDataArray> {
  return new Promise(async (resolve, reject): Promise<void> => {
    try {
      // Needs to be assigned somewhere else.
      const columns = {
        game: 0,
        gameTwitch: -1,
        category: 3,
        system: 2,
        region: -1,
        release: -1,
        player: 1,
      };

      const resp = await needle('get', 'https://horaro.org/esa/tceu19.json');
      const runItems: HoraroScheduleItem[] = resp.body.schedule.items;
      const defaultSetupTime: number = resp.body.schedule.setup_t;

      const runDataArray = await mapSeries(runItems, async (run): Promise<RunData> => {
        const runData: RunData = {
          teams: [],
          customData: {},
          id: uuid(),
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

        // Setup Time.
        // (need to do custom setup times here as well)
        runData.setupTime = msToTimeStr(defaultSetupTime * 1000);
        runData.setupTimeS = defaultSetupTime;

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

        return runData;
      });

      resolve(runDataArray);
    } catch (err) {
      reject(err);
    }
  });
}

export default class HoraroImport {
  /* eslint-disable */
  private nodecg: NodeCG;
  private runDataArray: Replicant<RunDataArray>;
  /* eslint-enable */

  constructor() {
    this.nodecg = nodecgApiContext.get();
    this.runDataArray = this.nodecg.Replicant('runDataArray');

    this.nodecg.log.info('Starting import of Horaro schedule.');
    parseSchedule().then((runDataArray): void => {
      this.runDataArray.value = runDataArray;
      this.nodecg.log.info('Successfully imported Horaro schedule.');
    }).catch((): void => {
      this.nodecg.log.warn('Error importing Horaro schedule.');
    });
  }
}
