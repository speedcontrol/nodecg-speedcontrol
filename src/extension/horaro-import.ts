import MarkdownIt from 'markdown-it';
import needle from 'needle';
import { NodeCG, Replicant } from 'nodecg/types/server'; // eslint-disable-line
import { mapSeries } from 'p-iteration';
import removeMd from 'remove-markdown';
import uuid from 'uuid/v4';
import { msToTimeStr, nullToUndefined } from './util/helpers';
import { RunData, RunDataArray, RunDataPlayer, RunDataTeam } from '../../types'; // eslint-disable-line
import * as nodecgApiContext from './util/nodecg-api-context';

const md = new MarkdownIt();

interface ParsedMarkdown {
  url: string | undefined;
  str: string | undefined;
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
 * Used to parse Markdown from schedules.
 * Currently returns URL of first link and a string with all formatting removed.
 * Will return both undefined if nothing is supplied.
 * @param str Markdowned string you wish to parse.
 */
function parseMarkdown(str?: string): ParsedMarkdown {
  const results: ParsedMarkdown = {
    url: undefined,
    str: undefined,
  };
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

      const resp = await needle('get', 'https://horaro.org/esa/2019-one.json');
      const runItems: HoraroScheduleItem[] = resp.body.schedule.items;
      const defaultSetupTime: number = resp.body.schedule.setup_t;

      const runDataArray = await mapSeries(runItems, async (run): Promise<RunData> => {
        const runData: RunData = {
          teams: [],
          customData: {},
          id: uuid(),
        };

        // General Run Data
        runData.game = nullToUndefined(run.data[columns.game]);
        runData.system = nullToUndefined(run.data[columns.system]);
        runData.category = nullToUndefined(run.data[columns.category]);
        runData.region = nullToUndefined(run.data[columns.region]);
        runData.release = nullToUndefined(run.data[columns.release]);

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
          const teamsRaw = await mapSeries(playerList.split(/\s+vs\.?\s+/), (team): {
            name: string | undefined;
            players: string[];
          } => {
            const nameMatch = team.match(/^(.+)(?=:\s)/);
            return {
              name: (nameMatch) ? nameMatch[0] : undefined,
              players: team.replace(/^(.+)(:\s)/, '').split(/\s*,\s*/),
            };
          });

          // Mapping team information from above into needed format.
          runData.teams = await mapSeries(teamsRaw, async (rawTeam): Promise<RunDataTeam> => {
            const team: RunData['teams'][0] = {
              id: uuid(),
              name: parseMarkdown(rawTeam.name).str,
              players: [],
            };

            // Mapping player information into needed format.
            team.players = await mapSeries(
              rawTeam.players,
              async (rawPlayer): Promise<RunDataPlayer> => {
                const { str, url } = parseMarkdown(rawPlayer);
                return {
                  name: str || '',
                  id: uuid(),
                  teamID: team.id,
                  social: {
                    twitch: (
                      url && url.includes('twitch.tv')
                    ) ? url.split('/')[url.split('/').length - 1] : undefined,
                  },
                };
              },
            );

            return team;
          });
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
