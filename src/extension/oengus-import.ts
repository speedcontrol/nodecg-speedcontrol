import { OengusMarathon, OengusSchedule, OengusUser, RunData, RunDataPlayer, RunDataTeam } from '@nodecg-speedcontrol/types'; // eslint-disable-line object-curly-newline, max-len
import { Duration, parse as isoParse, toSeconds } from 'iso8601-duration';
import { isObject } from 'lodash';
import needle, { NeedleResponse } from 'needle';
import { mapSeries } from 'p-iteration';
import { v4 as uuid } from 'uuid';
import { searchForTwitchGame, searchForUserDataMultiple } from './srcom-api';
import { verifyTwitchDir } from './twitch-api';
import { checkGameAgainstIgnoreList, getTwitchUserFromURL, padTimeNumber, processAck, to } from './util/helpers'; // eslint-disable-line object-curly-newline, max-len
import { get as ncgGet } from './util/nodecg';
import { defaultSetupTime, oengusImportStatus, runDataArray } from './util/replicants';

const nodecg = ncgGet();
const config = nodecg.bundleConfig;

/**
 * Make a GET request to Oengus API.
 * @param endpoint Oengus API endpoint you want to access.
 */
async function get(endpoint: string): Promise<NeedleResponse> {
  try {
    nodecg.log.debug(`[Oengus Import] API request processing on ${endpoint}`);
    const resp = await needle(
      'get',
      `https://${config.oengus.useSandbox ? 'sandbox.' : ''}oengus.io/api${endpoint}`,
      null,
      {
        headers: {
          'User-Agent': 'nodecg-speedcontrol',
          Accept: 'application/json',
        },
      },
    );
    if (resp.statusCode !== 200) {
      throw new Error(`Status Code: ${resp.statusCode} - Body: ${JSON.stringify(resp.body)}`);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: parser exists but isn't in the typings
    } else if (resp.parser !== 'json') {
      throw new Error('Response was not JSON');
    }
    nodecg.log.debug(`[Oengus Import] API request successful on ${endpoint}`);
    return resp;
  } catch (err) {
    nodecg.log.debug(`[Oengus Import] API request error on ${endpoint}:`, err);
    throw err;
  }
}

/**
 * Format to time string from Duration object.
 * @param duration Duration object you want to format.
 */
function formatDuration(duration: Duration): string {
  const digits: (string | number)[] = [];
  digits.push(duration.hours ? padTimeNumber(duration.hours) : '00');
  digits.push(duration.minutes ? padTimeNumber(duration.minutes) : '00');
  digits.push(duration.seconds ? padTimeNumber(duration.seconds) : '00');
  return digits.join(':');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isOengusMarathon(source: any): source is OengusMarathon {
  return (typeof source.id === 'string' && typeof source.name === 'string');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isOengusSchedule(source: any): source is OengusSchedule {
  return (typeof source.id === 'number' && source.lines !== undefined);
}

/**
 * Resets the replicant's values to default.
 */
function resetImportStatus(): void {
  oengusImportStatus.value.importing = false;
  oengusImportStatus.value.item = 0;
  oengusImportStatus.value.total = 0;
  nodecg.log.debug('[Oengus Import] Import status restored to default');
}

async function runnerToPlayer(runner: OengusUser, team: RunDataTeam): Promise<RunDataPlayer> {
  const playerTwitch = runner.connections
    ?.find((c) => c.platform === 'TWITCH')?.username;
  const playerYoutube = runner.connections
    ?.find((c) => c.platform === 'YOUTUBE')?.username;
  const playerPronouns = runner.pronouns;
  const player: RunDataPlayer = {
    name: runner.displayName || runner.username,
    id: uuid(),
    teamID: team.id,
    social: {
      twitch: playerTwitch || undefined,
      youtube: playerYoutube || undefined,
    },
    country: runner.country?.toLowerCase() || undefined,
    pronouns: playerPronouns?.join(', ') || undefined,
    customData: {},
  };
  if (!config.oengus.disableSpeedrunComLookup) {
    const playerTwitter = runner.connections
      ?.find((c) => c.platform === 'TWITTER')?.username;
    const playerSrcom = runner.connections
      ?.find((c) => c.platform === 'SPEEDRUNCOM')?.username;
    const data = await searchForUserDataMultiple(
      { type: 'srcom', val: playerSrcom },
      { type: 'twitch', val: playerTwitch },
      { type: 'twitter', val: playerTwitter },
      { type: 'name', val: runner.username },
    );
    if (data) {
      // Always favour the supplied Twitch username/country/pronouns
      // from Oengus if available.
      if (!playerTwitch) {
        const tURL = data.twitch?.uri || undefined;
        player.social.twitch = getTwitchUserFromURL(tURL);
      }
      if (!runner.country) player.country = data.location?.country.code || undefined;
      if (!runner.pronouns?.length) {
        player.pronouns = data.pronouns?.toLowerCase() || undefined;
      }
    }
  }

  return player;
}

/**
 * Import schedule data in from Oengus.
 * @param marathonShort Oengus' marathon shortname you want to import.
 * @param slug A user defined part in the url that is used when fetching a schedule.
 */
async function importSchedule(marathonShort: string, slug: string): Promise<void> {
  try {
    oengusImportStatus.value.importing = true;
    const marathonResp = await get(`/v1/marathons/${marathonShort}`);
    const scheUrl = `/v2/marathons/${marathonShort}/schedules/for-slug/${slug}?withCustomData=true`;
    const scheduleResp = await get(scheUrl);
    if (!isOengusMarathon(marathonResp.body)) {
      throw new Error('Did not receive marathon data correctly');
    }
    if (!isOengusSchedule(scheduleResp.body)) {
      throw new Error('Did not receive schedule data correctly');
    }
    defaultSetupTime.value = toSeconds(isoParse(marathonResp.body.defaultSetupTime));
    const oengusLines = scheduleResp.body.lines;

    // This is updated for every run so we can calculate a scheduled time for each one.
    let scheduledTime = Math.floor(Date.parse(marathonResp.body.startDate) / 1000);

    // Filtering out any games on the ignore list before processing them all.
    const newRunDataArray = await mapSeries(oengusLines.filter((line) => (
      !checkGameAgainstIgnoreList(line.game, 'oengus')
    )), async (line, index, arr) => {
      oengusImportStatus.value.item = index + 1;
      oengusImportStatus.value.total = arr.length;

      // If Oengus ID matches run already imported, re-use our UUID.
      const matchingOldRun = runDataArray.value
        .find((oldRun) => oldRun.externalID === line.id.toString());

      const runData: RunData = {
        teams: [],
        customData: {},
        id: matchingOldRun?.id ?? uuid(),
        externalID: line.id.toString(),
      };

      // General Run Data
      runData.game = line.game || undefined;
      runData.system = line.console || undefined;
      runData.category = line.category || undefined;
      const parsedEstimate = isoParse(line.estimate);
      runData.estimate = formatDuration(parsedEstimate);
      runData.estimateS = toSeconds(parsedEstimate);
      const parsedSetup = isoParse(line.setupTime);
      runData.setupTime = formatDuration(parsedSetup);
      runData.setupTimeS = toSeconds(parsedSetup);
      if (line.setupBlock) {
        // Game name set to "Setup" if the line is a setup block.
        runData.game = line.setupBlockText || 'Setup';
        runData.gameTwitch = 'Just Chatting';
        // Estimate for a setup block will be the setup time instead.
        runData.estimate = runData.setupTime;
        runData.estimateS = runData.setupTimeS;
        runData.setupTime = formatDuration({ seconds: 0 });
        runData.setupTimeS = 0;
      } else if (line.game) {
        // Attempt to find Twitch directory on speedrun.com if setting is enabled.
        let srcomGameTwitch;
        if (!config.oengus.disableSpeedrunComLookup) {
          [, srcomGameTwitch] = await to(searchForTwitchGame(line.game));
        }
        let gameTwitch;
        // Verify some game directory supplied exists on Twitch.
        for (const str of [srcomGameTwitch, line.game]) {
          if (str) {
            gameTwitch = (await to(verifyTwitchDir(str)))[1]?.name;
            if (gameTwitch) {
              break; // If a directory was successfully found, stop loop early.
            }
          }
        }
        runData.gameTwitch = gameTwitch;
      }

      // Custom Data
      if (line.customData) {
        let parsed; try { parsed = JSON.parse(line.customData); } catch (err) { /* err */ }
        if (parsed && isObject(parsed)) {
          Object.entries(parsed).forEach(([k, v]) => {
            if (!v) return;
            if (typeof v === 'string') runData.customData[k] = v;
            else runData.customData[k] = JSON.stringify(v);
          });
        }
      }

      // Add the scheduled time then update the value above for the next run.
      runData.scheduled = new Date(scheduledTime * 1000).toISOString();
      runData.scheduledS = scheduledTime;
      scheduledTime += runData.estimateS + runData.setupTimeS;

      // Team Data
      runData.teams = await mapSeries(line.runners, async (runner) => {
        const team: RunDataTeam = {
          id: uuid(),
          players: [],
        };

        let player: RunDataPlayer;

        if (runner.profile) {
          player = await runnerToPlayer(runner.profile, team);
        } else {
          // Oengus supports "fake" users, they do not have a profile
          player = {
            name: runner.runnerName,
            id: uuid(),
            teamID: team.id,
            social: {},
            customData: {},
          };
        }

        team.players.push(player);

        return team;
      });
      return runData;
    });
    runDataArray.value = newRunDataArray;
    resetImportStatus();
  } catch (err) {
    resetImportStatus();
    throw err;
  }
}

nodecg.listenFor('importOengusSchedule', async (data, ack) => {
  try {
    if (oengusImportStatus.value.importing) {
      throw new Error('Already importing schedule');
    }
    nodecg.log.info('[Oengus Import] Started importing schedule');
    await importSchedule(data.marathonShort, data.slug);
    nodecg.log.info('[Oengus Import] Successfully imported schedule from Oengus');
    processAck(ack, null);
  } catch (err) {
    nodecg.log.warn('[Oengus Import] Error importing schedule:', err);
    processAck(ack, err);
  }
});
