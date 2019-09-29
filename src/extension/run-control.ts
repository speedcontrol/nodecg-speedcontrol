import clone from 'clone';
import _ from 'lodash';
import { RunDataActiveRunSurrounding, TwitchAPIData } from '../../schemas';
import { RunData, RunDataActiveRun, RunDataArray, RunDataPlayer, RunDataTeam, Timer } from '../../types'; // eslint-disable-line
import * as events from './util/events';
import Helpers from './util/helpers';
import { get } from './util/nodecg';

const {
  timeStrToMS,
  msToTimeStr,
  processAck,
  formPlayerNamesStr,
  getTwitchChannels,
  to,
} = Helpers;
const nodecg = get();

const h = new Helpers(nodecg);
const array = nodecg.Replicant<RunDataArray>('runDataArray');
const activeRun = nodecg.Replicant<RunDataActiveRun>('runDataActiveRun');
const activeRunSurr = nodecg.Replicant<RunDataActiveRunSurrounding>('runDataActiveRunSurrounding');
const timer = nodecg.Replicant<Timer>('timer');
const twitchAPIData = nodecg.Replicant<TwitchAPIData>('twitchAPIData');

/**
 * Used to update the replicant that stores ID references to previous/current/next runs.
 */
function changeSurroundingRuns(): void {
  let previous: RunData | undefined;
  let current: RunData | undefined;
  let next: RunData | undefined;

  if (!activeRun.value) {
    // No current run set, we must be at the start, only set that one.
    [next] = array.value;
  } else {
    current = activeRun.value; // Current will always be the active one.

    // Try to find currently set runs in the run data array.
    const currentIndex = h.findRunIndexFromId(current.id);
    const previousIndex = h.findRunIndexFromId(activeRunSurr.value.previous);
    const nextIndex = h.findRunIndexFromId(activeRunSurr.value.next);

    if (currentIndex >= 0) { // Found current run in array.
      if (currentIndex > 0) {
        [previous,, next] = array.value.slice(currentIndex - 1);
      } else { // We're at the start and can't splice -1.
        [, next] = array.value.slice(0);
      }
    } else if (previousIndex >= 0) { // Found previous run in array, use for reference.
      [previous,, next] = array.value.slice(previousIndex);
    } else if (nextIndex >= 0) { // Found next run in array, use for reference.
      [previous,, next] = array.value.slice(nextIndex - 2);
    }
  }

  activeRunSurr.value = {
    previous: (previous) ? previous.id : undefined,
    current: (current) ? current.id : undefined,
    next: (next) ? next.id : undefined,
  };
}

/**
 * Change the active run to the one specified if it exists.
 * @param id The unique ID of the run you wish to change to.
 */
function changeActiveRun(id?: string): Promise<void> {
  return new Promise(async (resolve): Promise<void> => {
    const runData = array.value.find((run): boolean => run.id === id);
    if (['running', 'paused'].includes(timer.value.state)) {
      throw new Error('Cannot change run while timer is running/paused.');
    } else if (runData) {
      if (twitchAPIData.value.sync) {
        // Constructing Twitch title and game to send off.
        const status = h.bundleConfig().twitch.streamTitle
          .replace(new RegExp('{{game}}', 'g'), runData.game || '')
          .replace(new RegExp('{{players}}', 'g'), formPlayerNamesStr(runData))
          .replace(new RegExp('{{category}}', 'g'), runData.category || '');
        let game = runData.gameTwitch;
        [, game] = (!game)
          ? await to(events.sendMessage('srcomTwitchGameSearch', runData.game))
          : [null, game];
        [, game] = await to(events.sendMessage('twitchGameSearch', game));
        game = game || h.bundleConfig().twitch.streamDefaultGame;
        to(events.sendMessage('twitchUpdateChannelInfo', { status, game }));

        // Construct/send featured channels if enabled.
        if (h.bundleConfig().twitch.ffzIntegration) {
          to(events.sendMessage(
            'updateFeaturedChannels',
            getTwitchChannels(runData),
          ));
        }
      }
      activeRun.value = clone(runData);
      nodecg.sendMessage('timerReset', true);
      resolve();
    } else if (!id) {
      throw new Error('Cannot change run as no run ID was supplied.');
    } else {
      throw new Error(`Cannot change run as a run with ID ${id} was not found.`);
    }
  });
}

/**
 * Deletes a run from the run data array.
 * @param id The unique ID of the run you wish to delete.
 */
function removeRun(id?: string): Promise<void> {
  return new Promise((resolve): void => {
    const runIndex = array.value.findIndex((run): boolean => run.id === id);
    if (runIndex >= 0) {
      array.value.splice(runIndex, 1);
      resolve();
    } else if (!id) {
      throw new Error('Cannot delete run as no run ID was supplied.');
    } else {
      throw new Error(`Cannot delete run as a run with ID ${id} was not found.`);
    }
  });
}

/**
 * Either edits a run (if we currently have it) or adds it.
 * @param runData Run Data object.
 * @param prevID ID of the run that this run will be inserted after if applicable.
 */
function modifyRun(runData: RunData, prevID?: string): Promise<void> {
  return new Promise((resolve): void => {
    // Loops through data, removes any keys that are falsey.
    const data = _.pickBy(runData, _.identity) as RunData;
    data.customData = _.pickBy(data.customData, _.identity);
    data.teams = data.teams.map((team): RunDataTeam => {
      const teamData = _.pickBy(team, _.identity) as RunDataTeam;
      teamData.players = teamData.players.map((player): RunDataPlayer => {
        const playerData = _.pickBy(player, _.identity) as RunDataPlayer;
        playerData.social = _.pickBy(playerData.social, _.identity);
        return playerData;
      });
      return teamData;
    });

    // Check all teams have players, if not throw an error.
    if (!data.teams.every((team): boolean => !!team.players.length)) {
      throw new Error('Cannot accept run data as team(s) are missing player(s).');
    }

    // Check all players have names, if not throw an error.
    const allNamesAdded = data.teams.every((team): boolean => (
      team.players.every((player): boolean => !!player.name)
    ));
    if (!allNamesAdded) {
      throw new Error('Cannot accept run data as player(s) are missing name(s).');
    }

    // Verify and convert estimate.
    if (data.estimate) {
      if (data.estimate.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
        const ms = timeStrToMS(data.estimate);
        data.estimate = msToTimeStr(ms);
        data.estimateS = ms / 1000;
      } else { // Throw error if format is incorrect.
        throw new Error('Cannot accept run data as estimate is in incorrect format.');
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
        throw new Error('Cannot accept run data as setup time is in incorrect format.');
      }
    } else {
      delete data.setupTime;
      delete data.setupTimeS;
    }

    const index = h.findRunIndexFromId(data.id);
    if (index >= 0) { // Run already exists, edit it.
      if (activeRun.value && data.id === activeRun.value.id) {
        activeRun.value = clone(data);
      }
      array.value[index] = clone(data);
    } else { // Run is new, add it.
      const prevIndex = h.findRunIndexFromId(prevID);
      array.value.splice(prevIndex + 1 || array.value.length, 0, clone(data));
    }

    resolve();
  });
}

/**
 * Removes the active run from the relevant replicant.
 */
function removeActiveRun(): Promise<void> {
  return new Promise((resolve): void => {
    if (['running', 'paused'].includes(timer.value.state)) {
      throw new Error('Cannot change run while timer is running/paused.');
    } else {
      activeRun.value = null;
      nodecg.sendMessage('timerReset', true);
      resolve();
    }
  });
}

/**
 * Removes all runs in the array and the currently active run.
 */
function removeAllRuns(): Promise<void> {
  return new Promise((resolve): void => {
    if (['running', 'paused'].includes(timer.value.state)) {
      throw new Error('Cannot remove all runs while timer is running/paused.');
    } else {
      array.value.length = 0;
      removeActiveRun();
      nodecg.sendMessage('timerReset', true);
      resolve();
    }
  });
}

// NodeCG messaging system.
nodecg.listenFor('changeActiveRun', (data, ack) => {
  changeActiveRun(data)
    .then(() => processAck(null, ack))
    .catch((err) => processAck(err, ack));
});
nodecg.listenFor('removeRun', (data, ack) => {
  removeRun(data)
    .then(() => processAck(null, ack))
    .catch((err) => processAck(err, ack));
});
nodecg.listenFor('modifyRun', (data, ack) => {
  modifyRun(data.runData, data.prevID)
    .then(() => processAck(null, ack))
    .catch((err) => processAck(err, ack));
});
nodecg.listenFor('changeToNextRun', (data, ack) => {
  changeActiveRun(activeRunSurr.value.next)
    .then(() => processAck(null, ack))
    .catch((err) => processAck(err, ack));
});
nodecg.listenFor('returnToStart', (data, ack) => {
  removeActiveRun()
    .then(() => processAck(null, ack))
    .catch((err) => processAck(err, ack));
});
nodecg.listenFor('removeAllRuns', (data, ack) => {
  removeAllRuns()
    .then(() => processAck(null, ack))
    .catch((err) => processAck(err, ack));
});
nodecg.listenFor('removeAllRuns', (data, ack) => {
  removeAllRuns()
    .then(() => processAck(null, ack))
    .catch((err) => processAck(err, ack));
});

activeRun.on('change', () => changeSurroundingRuns());
array.on('change', () => changeSurroundingRuns());
