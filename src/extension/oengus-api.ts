import { Duration, parse as isoParse, toSeconds } from 'iso8601-duration';
import needle, { NeedleResponse } from 'needle';
import { mapSeries } from 'p-iteration';
import uuid from 'uuid/v4';
import { RunData, RunDataArray, RunDataPlayer, RunDataTeam } from '../../types'; // eslint-disable-line object-curly-newline, max-len
import { OengusSchedule } from '../../types/Oengus';
import { checkGameAgainstIgnoreList, padTimeNumber, processAck } from './util/helpers';
import { get as ncgGet } from './util/nodecg';

const nodecg = ncgGet();
const runDataArray = nodecg.Replicant<RunDataArray>('runDataArray');

/**
 * Make a GET request to Oengus API.
 * @param endpoint
 */
async function get(endpoint: string): Promise<NeedleResponse> {
  try {
    nodecg.log.debug(`[Oengus] API request processing on ${endpoint}`);
    const resp = await needle(
      'get',
      `https://oengus.io/api${endpoint}`,
      null,
      {
        headers: {
          'User-Agent': 'nodecg-speedcontrol',
          Accept: 'application/json',
        },
      },
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore: parser exists but isn't in the typings
    if (resp.parser !== 'json') {
      throw new Error('Response was not JSON');
    } else if (resp.statusCode !== 200) {
      throw new Error(JSON.stringify(resp.body));
    }
    nodecg.log.debug(`[Oengus] API request successful on ${endpoint}`);
    return resp;
  } catch (err) {
    nodecg.log.debug(`Oengus] API request error on ${endpoint}:`, err);
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
function isOengusSchedule(source: any): source is OengusSchedule {
  return (typeof source.id === 'number' && source.lines !== undefined);
}

/**
 * Import schedule data in from Oengus.
 * @param marathonId Oengus's marathon id you want to import.
 * @param useJapanese Use or not usernameJapanese in user data.
 */
async function importSchedule(marathonId: string, useJapanese: boolean): Promise<void> {
  // Changing import status is needed?
  const resp = await get(`/marathon/${marathonId}/schedule`);
  if (!isOengusSchedule(resp.body)) {
    throw new Error('Failed to import schedule from Oengus');
  }
  const oengusLines = resp.body.lines;

  // Filtering out any games on the ignore list before processing them all.
  const newRunDataArray = await mapSeries(oengusLines.filter((line) => (
    !checkGameAgainstIgnoreList(line.gameName)
  )), async (line) => {
    const runData: RunData = {
      teams: [],
      customData: {},
      id: uuid(),
    };

    // General Run Data
    runData.game = line.gameName ?? undefined;
    runData.system = line.console ?? undefined;
    runData.category = line.categoryName ?? undefined;
    const parsedEstimate = isoParse(line.estimate);
    runData.estimate = formatDuration(parsedEstimate);
    runData.estimateS = toSeconds(parsedEstimate);
    const parsedSetup = isoParse(line.setupTime);
    runData.setupTime = formatDuration(parsedSetup);
    runData.setupTimeS = toSeconds(parsedSetup);
    if (line.setupBlock) {
      // "Setup" will set to RunData.game if the line is setup block
      runData.game = 'Setup';
      // In setup block, 'setupTime' should be estimated.
      runData.estimate = runData.setupTime;
      runData.estimateS = runData.setupTimeS;
      runData.setupTime = formatDuration({ seconds: 0 });
      runData.setupTimeS = 0;
    }

    // Team Data
    runData.teams = await mapSeries(line.runners, (runner) => {
      const team: RunDataTeam = {
        id: uuid(),
        players: [],
      };
      const player: RunDataPlayer = {
        name: (useJapanese && runner.usernameJapanese) ? runner.usernameJapanese : runner.username,
        id: uuid(),
        teamID: team.id,
        social: {},
      };
      if (runner.twitchName) {
        player.social.twitch = runner.twitchName;
      }
      team.players.push(player);
      return team;
    });
    return runData;
  });
  runDataArray.value = newRunDataArray;
}

nodecg.listenFor('importOengusSchedule', (data, ack) => {
  try {
    nodecg.log.info('[Oengus] Started importing schedule');
    importSchedule(data.marathonId, data.useJapanese)
      .then(() => {
        nodecg.log.info('[Oengus] Successfully imported schedule from Oengus');
        processAck(ack, null);
      })
      .catch((err) => {
        nodecg.log.warn('[Oengus] Error importing schedule:', err);
        processAck(ack, err);
      });
  } catch (err) {
    nodecg.log.warn('[Oengus] Error importing schedule:', err);
    processAck(ack, err);
  }
});
