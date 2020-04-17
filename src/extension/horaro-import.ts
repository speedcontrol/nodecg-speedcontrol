import crypto from 'crypto';
import MarkdownIt from 'markdown-it';
import needle from 'needle';
import { mapSeries } from 'p-iteration';
import parseDuration from 'parse-duration';
import removeMd from 'remove-markdown';
import { DefaultSetupTime, HoraroImportStatus } from 'schemas';
import { HoraroSchedule, ImportOptions, ImportOptionsSanitized, ParsedMarkdown, RunData, RunDataArray, RunDataPlayer, RunDataTeam } from 'types'; // eslint-disable-line object-curly-newline, max-len
import { v4 as uuid } from 'uuid';
import { searchForTwitchGame, searchForUserDataMultiple } from './srcom-api';
import { verifyTwitchDir } from './twitch-api';
import { bundleConfig, checkGameAgainstIgnoreList, getTwitchUserFromURL, msToTimeStr, processAck, to } from './util/helpers'; // eslint-disable-line object-curly-newline, max-len
import { get } from './util/nodecg';

const nodecg = get();
const config = bundleConfig();
const md = new MarkdownIt();
const runDataArray = nodecg.Replicant<RunDataArray>('runDataArray');
const importStatus = nodecg.Replicant<HoraroImportStatus>('horaroImportStatus', {
  persistent: false,
});
const defaultSetupTime = nodecg.Replicant<DefaultSetupTime>('defaultSetupTime');
const scheduleDataCache: { [k: string]: HoraroSchedule } = {};

/**
 * Used to parse Markdown from schedules.
 * Returns URL of first link and a string with all formatting removed.
 * Will return both undefined if nothing is supplied.
 * @param str Markdowned string you wish to parse.
 */
function parseMarkdown(str?: string | null): ParsedMarkdown {
  const results: ParsedMarkdown = {};
  if (str) {
    // Some stuff can break this, so try/catching it if needed.
    try {
      const res = md.parseInline(str, {});
      let url;
      if (res[0] && res[0].children) {
        url = res[0].children.find((child) => (
          child.type === 'link_open' && child.attrs
          && child.attrs[0] && child.attrs[0][0] === 'href'
        ));
      }
      results.url = (url && url.attrs) ? url.attrs[0][1] : undefined;
      results.str = removeMd(str);
    } catch (err) {
      // return nothing
    }
  }
  return results;
}

/**
 * Generates a hash based on the contents of the string based run data from Horaro.
 * @param colData Array of strings (or nulls), obtained from the Horaro JSON data.
 */
function generateRunHash(colData: (string | null)[]): string {
  return crypto.createHash('sha1').update(colData.join(), 'utf8').digest('hex');
}

/**
 * Resets the replicant's values to default.
 */
function resetImportStatus(): void {
  importStatus.value.importing = false;
  importStatus.value.item = 0;
  importStatus.value.total = 0;
  nodecg.log.debug('[Horaro Import] Import status restored to default');
}

/**
 * Load schedule data in from Horaro, store in a temporary cache and return it.
 * @param url URL of Horaro schedule.
 * @param dashID UUID of dashboard element, generated on panel load and passed here.
 */
async function loadSchedule(url: string, dashID: string): Promise<HoraroSchedule> {
  try {
    let jsonURL = `${url}.json`;
    if (url.match((/\?key=/))) { // If schedule URL has a key in it, extract it correctly.
      const urlMatch = (url.match(/(.*?)(?=(\?key=))/) as RegExpMatchArray)[0];
      const keyMatch = (url.match(/(?<=(\?key=))(.*?)$/) as RegExpMatchArray)[0];
      jsonURL = `${urlMatch}.json?key=${keyMatch}`;
    }
    const resp = await needle('get', encodeURI(jsonURL));
    if (resp.statusCode !== 200) {
      throw new Error(`HTTP status code was ${resp.statusCode}`);
    }
    scheduleDataCache[dashID] = resp.body;
    nodecg.log.debug('[Horaro Import] Schedule successfully loaded');
    return resp.body;
  } catch (err) {
    nodecg.log.debug('[Horaro Import] Schedule could not be loaded:', err);
    throw err;
  }
}

/**
 * Imports schedule data loaded in above function.
 * @param opts Options on how the schedule data should be parsed, including column numbers.
 * @param dashID UUID of dashboard element, generated on panel load and passed here.
 */
async function importSchedule(optsO: ImportOptions, dashID: string): Promise<void> {
  try {
    importStatus.value.importing = true;
    const data = scheduleDataCache[dashID];
    const runItems = data.schedule.items;
    const setupTime = data.schedule.setup_t;
    defaultSetupTime.value = setupTime;

    // Sanitizing import option inputs with this "mess".
    const opts: ImportOptionsSanitized = {
      columns: {
        game: (optsO.columns.game === null) ? -1 : optsO.columns.game,
        gameTwitch: (optsO.columns.gameTwitch === null) ? -1 : optsO.columns.gameTwitch,
        category: (optsO.columns.category === null) ? -1 : optsO.columns.category,
        system: (optsO.columns.system === null) ? -1 : optsO.columns.system,
        region: (optsO.columns.region === null) ? -1 : optsO.columns.region,
        release: (optsO.columns.release === null) ? -1 : optsO.columns.release,
        player: (optsO.columns.player === null) ? -1 : optsO.columns.player,
        externalID: (optsO.columns.externalID === null) ? -1 : optsO.columns.externalID,
        custom: {},
      },
      split: optsO.split,
    };
    Object.keys(optsO.columns.custom).forEach((col) => {
      const val = optsO.columns.custom[col];
      opts.columns.custom[col] = (val === null) ? -1 : val;
    });

    const externalIDsSeen: string[] = [];
    // Filtering out any games on the ignore list before processing them all.
    const newRunDataArray = await mapSeries(runItems.filter((run) => (
      !checkGameAgainstIgnoreList(run.data[opts.columns.game])
    )), async (run, index, arr) => {
      importStatus.value.item = index + 1;
      importStatus.value.total = arr.length;

      // If a run with the same external ID exists already, use the same UUID.
      // This will only work for the first instance of an external ID; for hashes, this is usually
      // only an issue if the same "run" happens twice in a schedule (for example a Setup block),
      // and for actual defined IDs from a column should never happen, but idiot proofing it.
      const externalID = run.data[opts.columns.externalID] || generateRunHash(run.data);
      let matchingOldRun;
      if (!externalIDsSeen.includes(externalID)) {
        matchingOldRun = runDataArray.value.find((oldRun) => oldRun.externalID === externalID);
        externalIDsSeen.push(externalID);
      }

      const runData: RunData = {
        teams: [],
        customData: {},
        id: matchingOldRun?.id || uuid(),
        externalID,
      };

      // General Run Data
      runData.game = parseMarkdown(run.data[opts.columns.game]).str;
      runData.system = parseMarkdown(run.data[opts.columns.system]).str;
      runData.category = parseMarkdown(run.data[opts.columns.category]).str;
      runData.region = parseMarkdown(run.data[opts.columns.region]).str;
      runData.release = parseMarkdown(run.data[opts.columns.release]).str;

      // Attempts to find the correct Twitch game directory.
      const game = parseMarkdown(run.data[opts.columns.game]);
      let gameTwitch = parseMarkdown(run.data[opts.columns.gameTwitch]).str;
      let srcomGameTwitch;
      if (!config.schedule.disableSpeedrunComLookup && !gameTwitch) {
        if (game.url && game.url.includes('speedrun.com')) {
          const gameAbbr = game.url
            .split('speedrun.com/')[game.url.split('speedrun.com/').length - 1]
            .split('/')[0]
            .split('#')[0];
          [, srcomGameTwitch] = await to(searchForTwitchGame(gameAbbr, true));
        }
        if (!srcomGameTwitch && game.str) {
          [, srcomGameTwitch] = await to(searchForTwitchGame(game.str));
        }
      }
      // Verify some game directory supplied exists on Twitch.
      for (const str of [gameTwitch, srcomGameTwitch, game.str]) {
        if (str) {
          [, gameTwitch] = await to(verifyTwitchDir(str));
          if (gameTwitch) {
            break; // If a directory was successfully found, stop loop early.
          }
        }
      }
      runData.gameTwitch = gameTwitch;

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
        if (!config.schedule.customData) {
          return;
        }
        const colSetting = config.schedule.customData.find((setting) => setting.key === col);
        if (!colSetting) {
          return;
        }
        const colData = run.data[opts.columns.custom[col]];
        const str = (!colSetting.ignoreMarkdown) ? parseMarkdown(colData).str : colData;
        if (str) {
          runData.customData[col] = str;
        }
      });

      // Players
      const playerList = run.data[opts.columns.player];
      if (playerList) {
        // Mapping team string into something more manageable.
        const teamSplittingRegex = [
          /\s+vs\.?\s+/, // vs/vs.
          /\s*,\s*/, // Comma (,)
        ];
        const teamsRaw = await mapSeries(
          playerList.split(teamSplittingRegex[opts.split]),
          (team) => {
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
          async (rawTeam) => {
            const team: RunDataTeam = {
              id: uuid(),
              name: parseMarkdown(rawTeam.name).str,
              players: [],
            };

            // Mapping player information into needed format.
            team.players = await mapSeries(
              rawTeam.players,
              async (rawPlayer) => {
                const { str, url } = parseMarkdown(rawPlayer);
                const twitchUsername = getTwitchUserFromURL(url);
                const player: RunDataPlayer = {
                  name: str || '',
                  id: uuid(),
                  teamID: team.id,
                  social: {
                    twitch: twitchUsername,
                  },
                };
                if (!config.schedule.disableSpeedrunComLookup) {
                  const sData = await searchForUserDataMultiple(twitchUsername, str);
                  if (sData) {
                    // Always favour the supplied Twitch username from schedule if available.
                    if (!twitchUsername) {
                      const tURL = (sData.twitch && sData.twitch.uri)
                        ? sData.twitch.uri : undefined;
                      player.social.twitch = getTwitchUserFromURL(tURL);
                    }
                    player.country = (sData.location) ? sData.location.country.code : undefined;
                  }
                }
                return player;
              },
            );

            return team;
          },
        );
      }

      nodecg.log.debug(`[Horaro Import] Successfully imported ${index + 1}/${runItems.length}`);
      return runData;
    });

    runDataArray.value = newRunDataArray;
    resetImportStatus();
  } catch (err) {
    resetImportStatus();
    throw err;
  }
}

nodecg.listenFor('loadSchedule', (data, ack) => {
  loadSchedule(data.url, data.dashID)
    .then((data_) => processAck(ack, null, data_))
    .catch((err) => processAck(ack, err));
});

nodecg.listenFor('importSchedule', async (data, ack) => {
  try {
    if (importStatus.value.importing) {
      throw new Error('Already importing schedule');
    }
    nodecg.log.info('[Horaro Import] Started importing schedule');
    await importSchedule(data.opts, data.dashID);
    nodecg.log.info('[Horaro Import] Successfully imported schedule');
    processAck(ack, null);
  } catch (err) {
    nodecg.log.warn('[Horaro Import] Error importing schedule:', err);
    processAck(ack, err);
  }
});
