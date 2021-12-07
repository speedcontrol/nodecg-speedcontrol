import { RunData, RunDataActiveRun, RunDataPlayer, RunDataTeam } from '@nodecg-speedcontrol/types'; // eslint-disable-line object-curly-newline, max-len
import clone from 'clone';
import _ from 'lodash';
import { setChannels } from './ffz-ws';
import { searchForTwitchGame } from './srcom-api';
import { resetTimer } from './timer';
import { updateChannelInfo, verifyTwitchDir } from './twitch-api';
import * as events from './util/events';
import { bundleConfig, findRunIndexFromId, formPlayerNamesStr, getTwitchChannels, msToTimeStr, processAck, timeStrToMS, to } from './util/helpers'; // eslint-disable-line object-curly-newline, max-len
import { get } from './util/nodecg';
import { runDataActiveRun, runDataActiveRunSurrounding, runDataArray, timer, twitchAPIData } from './util/replicants';

const nodecg = get();

/**
 * Used to update the replicant that stores ID references to previous/current/next runs.
 */
function changeSurroundingRuns(): void {
  let previous: RunData | undefined;
  let current: RunData | undefined;
  let next: RunData | undefined;

  if (!runDataActiveRun.value) {
    // No current run set, we must be at the start, only set that one.
    [next] = runDataArray.value;
  } else {
    current = runDataActiveRun.value; // Current will always be the active one.

    // Try to find currently set runs in the run data array.
    const currentIndex = findRunIndexFromId(current.id);
    const previousIndex = findRunIndexFromId(runDataActiveRunSurrounding.value.previous);
    const nextIndex = findRunIndexFromId(runDataActiveRunSurrounding.value.next);

    if (currentIndex >= 0) { // Found current run in array.
      if (currentIndex > 0) {
        [previous,, next] = runDataArray.value.slice(currentIndex - 1);
      } else { // We're at the start and can't splice -1.
        [, next] = runDataArray.value.slice(0);
      }
    } else if (previousIndex >= 0) { // Found previous run in array, use for reference.
      [previous,, next] = runDataArray.value.slice(previousIndex);
    } else if (nextIndex >= 0) { // Found next run in array, use for reference.
      [previous,, next] = runDataArray.value.slice(nextIndex - 2);
    }
  }

  runDataActiveRunSurrounding.value = {
    previous: (previous) ? previous.id : undefined,
    current: (current) ? current.id : undefined,
    next: (next) ? next.id : undefined,
  };

  nodecg.log.debug('[Run Control] Recalculated surrounding runs');
}

/**
 * Used to update the Twitch information, used by functions in this file.
 * @param runData Run Data object.
 */
async function updateTwitchInformation(runData: RunData): Promise<boolean> {
  if (!twitchAPIData.value.sync) {
    return false;
  }

  // Constructing Twitch title and game to send off.
  const status = bundleConfig().twitch.streamTitle
    .replace(/{{game}}/g, runData.game || '')
    .replace(/{{players}}/g, formPlayerNamesStr(runData))
    .replace(/{{category}}/g, runData.category || '');

  // Attempts to find the correct Twitch game directory.
  let { gameTwitch } = runData;
  if (!gameTwitch && runData.game) {
    const [, srcomGameTwitch] = await to(searchForTwitchGame(runData.game));
    gameTwitch = srcomGameTwitch || runData.game;
  }
  // TDO: Is this extra lookup needed if the next one just kinda does it anyway?
  if (gameTwitch) { // Verify game directory supplied exists on Twitch.
    gameTwitch = (await to(verifyTwitchDir(gameTwitch)))[1]?.name;
  }

  to(updateChannelInfo(
    status,
    gameTwitch || bundleConfig().twitch.streamDefaultGame,
  ));

  // Construct/send featured channels if enabled.
  if (bundleConfig().twitch.ffzIntegration) {
    to(setChannels(getTwitchChannels(runData)));
  }

  return !gameTwitch;
}

/**
 * Change the active run to the one specified if it exists.
 * @param id The unique ID of the run you wish to change to.
 */
async function changeActiveRun(id?: string): Promise<boolean> {
  try {
    if (['running', 'paused'].includes(timer.value.state)) {
      throw new Error('Timer is running/paused');
    }
    if (!id) {
      throw new Error('No run ID was supplied');
    }
    const runData = runDataArray.value.find((run) => run.id === id);
    if (!runData) {
      throw new Error(`Run with ID ${id} was not found`);
    } else {
      const noTwitchGame = await updateTwitchInformation(runData);
      runDataActiveRun.value = clone(runData);
      to(resetTimer(true));
      nodecg.log.debug(`[Run Control] Active run changed to ${id}`);
      return noTwitchGame;
    }
  } catch (err) {
    nodecg.log.debug('[Run Control] Could not successfully change active run:', err);
    throw err;
  }
}

/**
 * Deletes a run from the run data array.
 * @param id The unique ID of the run you wish to delete.
 */
async function removeRun(id?: string): Promise<void> {
  try {
    if (!id) {
      throw new Error('No run ID was supplied');
    }
    const runIndex = runDataArray.value.findIndex((run) => run.id === id);
    if (runIndex < 0) {
      throw new Error(`Run with ID ${id} was not found`);
    } else {
      runDataArray.value.splice(runIndex, 1);
      nodecg.log.debug(`[Run Control] Successfully removed run ${id}`);
      return;
    }
  } catch (err) {
    nodecg.log.debug('[Run Control] Could not successfully remove run:', err);
    throw err;
  }
}

/**
 * Either edits a run (if we currently have it) or adds it.
 * @param runData Run Data object.
 * @param prevID ID of the run that this run will be inserted after if applicable.
 * @param twitch Whether to update the Twitch information as well.
 */
async function modifyRun(runData: RunData, prevID?: string, twitch = false): Promise<boolean> {
  try {
    // Loops through data, removes any keys that are falsey.
    const data = _.pickBy(runData, _.identity) as RunData;
    data.customData = _.pickBy(data.customData, _.identity);
    data.teams = data.teams.map((team) => {
      const teamData = _.pickBy(team, _.identity) as RunDataTeam;
      teamData.players = teamData.players.map((player) => {
        const playerData = _.pickBy(player, _.identity) as RunDataPlayer;
        playerData.social = _.pickBy(playerData.social, _.identity);
        playerData.customData = _.pickBy(playerData.customData, _.identity);
        return playerData;
      });
      return teamData;
    });

    // Check all teams have players, if not throw an error.
    if (!data.teams.every((team) => !!team.players.length)) {
      throw new Error('Team(s) are missing player(s)');
    }

    // Check all players have names, if not throw an error.
    const allNamesAdded = data.teams.every((team) => (
      team.players.every((player) => !!player.name)
    ));
    if (!allNamesAdded) {
      throw new Error('Player(s) are missing name(s)');
    }

    // If set as relay, set any missing indexes if needed. If the opposite, delete them.
    if (runData.relay) {
      data.teams = data.teams.map((team) => ({ relayPlayerID: team.players[0]?.id, ...team }));
    } else {
      for (const team of data.teams) {
        delete team.relayPlayerID;
      }
    }

    // Verify and convert estimate.
    if (data.estimate) {
      if (data.estimate.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
        const ms = timeStrToMS(data.estimate);
        data.estimate = msToTimeStr(ms);
        data.estimateS = ms / 1000;
      } else { // Throw error if format is incorrect.
        throw new Error('Estimate is in incorrect format');
      }
    } else {
      delete data.estimate;
      delete data.estimateS;
    }

    // Verify and convert setup time.
    if (data.setupTime) {
      if (data.setupTime.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
        const ms = timeStrToMS(data.setupTime);
        data.setupTime = msToTimeStr(ms);
        data.setupTimeS = ms / 1000;
      } else { // Throw error if format is incorrect.
        throw new Error('Setup time is in incorrect format');
      }
    } else {
      delete data.setupTime;
      delete data.setupTimeS;
    }

    const index = findRunIndexFromId(data.id);
    if (index >= 0) { // Run already exists, edit it.
      if (runDataActiveRun.value && data.id === runDataActiveRun.value.id) {
        runDataActiveRun.value = clone(data);
      }
      runDataArray.value[index] = clone(data);
    } else { // Run is new, add it.
      const prevIndex = findRunIndexFromId(prevID);
      runDataArray.value.splice(prevIndex + 1 || runDataArray.value.length, 0, clone(data));
    }

    const noTwitchGame = (twitch) ? await updateTwitchInformation(runData) : false;
    return noTwitchGame;
  } catch (err) {
    nodecg.log.debug('[Run Control] Could not successfully modify run:', err);
    throw err;
  }
}

/**
 * Modifies the relay player ID of a team inside of a run.
 * @param runID ID of the run you wish to modify.
 * @param teamID ID of the team inside of the run you wish to modify.
 * @param playerID ID of the player you wish to set as the one currently playing.
 */
async function modifyRelayPlayerID(runID: string, teamID: string, playerID: string): Promise<void> {
  try {
    const run = clone(runDataArray.value.find((r) => r.id === runID));
    if (!run) {
      throw new Error(`Run with ID ${runID} was not found`);
    }
    if (!run.relay) {
      throw new Error(`Run with ID ${runID} is not set as a relay`);
    }
    const teamIndex = run.teams.findIndex((t) => t.id === teamID);
    if (teamIndex < 0) {
      throw new Error(`Team with ID ${runID} was not found`);
    }
    const player = run.teams[teamIndex].players.find((p) => p.id === playerID);
    if (!player) {
      throw new Error(`Player with ID ${playerID} was not found`);
    }
    run.teams[teamIndex].relayPlayerID = player.id;
    await modifyRun(run);
  } catch (err) {
    nodecg.log.debug('[Run Control] Could not successfully modify relay player ID:', err);
    throw err;
  }
}

/**
 * Removes the active run from the relevant replicant.
 */
async function removeActiveRun(): Promise<void> {
  try {
    if (['running', 'paused'].includes(timer.value.state)) {
      throw new Error('Timer is running/paused');
    }
    (runDataActiveRun.value as RunDataActiveRun) = undefined;
    to(resetTimer(true));
    nodecg.log.debug('[Run Control] Successfully removed active run');
  } catch (err) {
    nodecg.log.debug('[Run Control] Could not successfully remove active run:', err);
  }
}

/**
 * Removes all runs in the array and the currently active run.
 */
async function removeAllRuns(): Promise<void> {
  try {
    if (['running', 'paused'].includes(timer.value.state)) {
      throw new Error('Timer is running/paused');
    }
    runDataArray.value.length = 0;
    removeActiveRun();
    to(resetTimer(true));
    nodecg.log.debug('[Run Control] Successfully removed all runs');
  } catch (err) {
    nodecg.log.debug('[Run Control] Could not successfully remove all runs:', err);
    throw err;
  }
}

// NodeCG messaging system.
nodecg.listenFor('changeActiveRun', (id, ack) => {
  changeActiveRun(id)
    .then((noTwitchGame) => processAck(ack, null, noTwitchGame))
    .catch((err) => processAck(ack, err));
});
nodecg.listenFor('removeRun', (id, ack) => {
  removeRun(id)
    .then(() => processAck(ack, null))
    .catch((err) => processAck(ack, err));
});
nodecg.listenFor('modifyRun', (data, ack) => {
  modifyRun(data.runData, data.prevID, data.updateTwitch)
    .then((noTwitchGame) => processAck(ack, null, noTwitchGame))
    .catch((err) => processAck(ack, err));
});
nodecg.listenFor('modifyRelayPlayerID', (data, ack) => {
  modifyRelayPlayerID(data.runID, data.teamID, data.playerID)
    .then(() => processAck(ack, null))
    .catch((err) => processAck(ack, err));
});
nodecg.listenFor('changeToNextRun', (data, ack) => {
  changeActiveRun(runDataActiveRunSurrounding.value.next)
    .then((noTwitchGame) => processAck(ack, null, noTwitchGame))
    .catch((err) => processAck(ack, err));
});
nodecg.listenFor('returnToStart', (data, ack) => {
  removeActiveRun()
    .then(() => processAck(ack, null))
    .catch((err) => processAck(ack, err));
});
nodecg.listenFor('removeAllRuns', (data, ack) => {
  removeAllRuns()
    .then(() => processAck(ack, null))
    .catch((err) => processAck(ack, err));
});

// Our messaging system.
events.listenFor('changeActiveRun', (id, ack) => {
  changeActiveRun(id)
    .then((noTwitchGame) => {
      processAck(ack, null, noTwitchGame);
      if (noTwitchGame) {
        nodecg.sendMessage('triggerAlert', 'NoTwitchGame');
      }
    })
    .catch((err) => processAck(ack, err));
});
events.listenFor('removeRun', (id, ack) => {
  removeRun(id)
    .then(() => processAck(ack, null))
    .catch((err) => processAck(ack, err));
});
events.listenFor('modifyRun', (data, ack) => {
  modifyRun(data.runData, data.prevID, data.updateTwitch)
    .then((noTwitchGame) => processAck(ack, null, noTwitchGame))
    .catch((err) => processAck(ack, err));
});
events.listenFor('modifyRelayPlayerID', (data, ack) => {
  modifyRelayPlayerID(data.runID, data.teamID, data.playerID)
    .then(() => processAck(ack, null))
    .catch((err) => processAck(ack, err));
});
events.listenFor('changeToNextRun', (data, ack) => {
  changeActiveRun(runDataActiveRunSurrounding.value.next)
    .then((noTwitchGame) => {
      processAck(ack, null, noTwitchGame);
      if (noTwitchGame) {
        nodecg.sendMessage('triggerAlert', 'NoTwitchGame');
      }
    })
    .catch((err) => processAck(ack, err));
});
events.listenFor('returnToStart', (data, ack) => {
  removeActiveRun()
    .then(() => processAck(ack, null))
    .catch((err) => processAck(ack, err));
});
events.listenFor('removeAllRuns', (data, ack) => {
  removeAllRuns()
    .then(() => processAck(ack, null))
    .catch((err) => processAck(ack, err));
});

runDataActiveRun.on('change', changeSurroundingRuns);
runDataArray.on('change', changeSurroundingRuns);
