import crypto from 'crypto';
import MarkdownIt from 'markdown-it';
import needle from 'needle';
import { mapSeries } from 'p-iteration';
import parseDuration from 'parse-duration';
import removeMd from 'remove-markdown';
import { v4 as uuid } from 'uuid';
import { DefaultSetupTime, HoraroImportStatus } from '../../schemas';
import { HoraroSchedule, ImportOptions, ImportOptionsSanitized, ParsedMarkdown, RunData, RunDataArray, RunDataTeam, UserData } from '../../types'; // eslint-disable-line object-curly-newline, max-len
import { searchForTwitchGame, searchForUserData } from './srcom-api';
import { verifyTwitchDir } from './twitch-api';
import { bundleConfig, msToTimeStr, processAck, to, checkGameAgainstIgnoreList } from './util/helpers'; // eslint-disable-line object-curly-newline, max-len
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
  if (!str) {
    return results;
  }
  // Some stuff can break this, so try/catching it if needed.
  try {
    const res = md.parseInline(str, {});
    const url = res[0].children.find((child) => (
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
async function querySRcomUserData(str?: string): Promise<UserData | undefined> {
  if (str && !config.schedule.disableSpeedrunComLookup) {
    try {
      const data = await searchForUserData(str);
      return data;
    } catch (err) {
      return undefined;
    }
  }
  return undefined;
}

/**
 * Attempt to get information about a player using several options.
 * @param name Name to attempt to use.
 * @param twitchURL Twitch URL to attempt to use.
 */
async function parseSRcomUserData(name?: string, twitchURL?: string): Promise<{
  country?: string;
  twitchURL?: string;
}> {
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

  return foundData;
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
        custom: {},
      },
      split: optsO.split,
    };
    Object.keys(optsO.columns.custom).forEach((col) => {
      const val = optsO.columns.custom[col];
      opts.columns.custom[col] = (val === null) ? -1 : val;
    });

    // Filtering out any games on the ignore list before processing them all.
    const hashesSeen: string[] = [];
    const newRunDataArray = await mapSeries(runItems.filter((run) => (
      !checkGameAgainstIgnoreList(run.data[opts.columns.game])
    )), async (run, index, arr) => {
      importStatus.value.item = index + 1;
      importStatus.value.total = arr.length;

      // If a run with the same hash exists already, assume it's the same and use the same UUID.
      // Will only work for the first instance of a hash, this is usually only an issue if the
      // same "run" happens twice in a schedule (for example a Setup block).
      const hash = generateRunHash(run.data);
      let matchingOldRun;
      if (!hashesSeen.includes(hash)) {
        matchingOldRun = runDataArray.value.find((oldRun) => oldRun.hash === hash);
        hashesSeen.push(hash);
      }
      const runData: RunData = {
        teams: [],
        customData: {},
        id: (matchingOldRun) ? matchingOldRun.id : uuid(),
        hash,
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
      gameTwitch = gameTwitch || srcomGameTwitch || game.str;
      if (gameTwitch) { // Verify game directory supplied exists on Twitch.
        [, gameTwitch] = await to(verifyTwitchDir(gameTwitch));
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

nodecg.listenFor('importSchedule', (data, ack) => {
  try {
    if (importStatus.value.importing) {
      throw new Error('Already importing schedule');
    }
    nodecg.log.info('[Horaro Import] Started importing schedule');
    importSchedule(data.opts, data.dashID)
      .then(() => {
        nodecg.log.info('[Horaro Import] Successfully imported schedule');
        processAck(ack, null);
      });
  } catch (err) {
    nodecg.log.warn('[Horaro Import] Error importing schedule:', err);
    processAck(ack, err);
  }
});
