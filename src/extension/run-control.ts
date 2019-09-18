import clone from 'clone';
import _ from 'lodash';
import { NodeCG, Replicant } from 'nodecg/types/server'; // eslint-disable-line
import { RunDataActiveRunSurrounding, TwitchAPIData } from '../../schemas';
import { RunData, RunDataActiveRun, RunDataArray, RunDataPlayer, RunDataTeam, Timer } from '../../types'; // eslint-disable-line
import * as events from './util/events';
import Helpers from './util/helpers';

const {
  timeStrToMS,
  msToTimeStr,
  processAck,
  formPlayerNamesStr,
  getTwitchChannels,
  to,
} = Helpers;

export default class RunControl {
  /* eslint-disable lines-between-class-members */
  private h: Helpers;
  private array: Replicant<RunDataArray>;
  private activeRun: Replicant<RunDataActiveRun>;
  private activeRunSurrounding: Replicant<RunDataActiveRunSurrounding>;
  private timer: Replicant<Timer>;
  private twitchAPIData: Replicant<TwitchAPIData>
  /* eslint-enable lines-between-class-members */

  constructor(nodecg: NodeCG) {
    this.h = new Helpers(nodecg);
    this.array = nodecg.Replicant('runDataArray');
    this.activeRun = nodecg.Replicant('runDataActiveRun');
    this.activeRunSurrounding = nodecg.Replicant('runDataActiveRunSurrounding');
    this.timer = nodecg.Replicant('timer');
    this.twitchAPIData = nodecg.Replicant('twitchAPIData');

    // NodeCG messaging system.
    nodecg.listenFor('changeActiveRun', (data, ack) => {
      this.changeActiveRun(data)
        .then(() => processAck(null, ack))
        .catch((err) => processAck(err, ack));
    });
    nodecg.listenFor('removeRun', (data, ack) => {
      this.removeRun(data)
        .then(() => processAck(null, ack))
        .catch((err) => processAck(err, ack));
    });
    nodecg.listenFor('modifyRun', (data, ack) => {
      this.modifyRun(data.runData, data.prevID)
        .then(() => processAck(null, ack))
        .catch((err) => processAck(err, ack));
    });
    nodecg.listenFor('changeToNextRun', (data, ack) => {
      this.changeActiveRun(this.activeRunSurrounding.value.next)
        .then(() => processAck(null, ack))
        .catch((err) => processAck(err, ack));
    });
    nodecg.listenFor('returnToStart', (data, ack) => {
      this.removeActiveRun()
        .then(() => processAck(null, ack))
        .catch((err) => processAck(err, ack));
    });
    nodecg.listenFor('removeAllRuns', (data, ack) => {
      this.removeAllRuns()
        .then(() => processAck(null, ack))
        .catch((err) => processAck(err, ack));
    });
    nodecg.listenFor('removeAllRuns', (data, ack) => {
      this.removeAllRuns()
        .then(() => processAck(null, ack))
        .catch((err) => processAck(err, ack));
    });

    this.activeRun.on('change', () => this.changeSurroundingRuns());
    this.array.on('change', () => this.changeSurroundingRuns());
  }

  /**
   * Used to update the replicant that stores ID references to previous/current/next runs.
   */
  changeSurroundingRuns(): void {
    let previous: RunData | undefined;
    let current: RunData | undefined;
    let next: RunData | undefined;

    if (!this.activeRun.value) {
      // No current run set, we must be at the start, only set that one.
      [next] = this.array.value;
    } else {
      current = this.activeRun.value; // Current will always be the active one.

      // Try to find currently set runs in the run data array.
      const currentIndex = this.h.findRunIndexFromId(current.id);
      const previousIndex = this.h.findRunIndexFromId(this.activeRunSurrounding.value.previous);
      const nextIndex = this.h.findRunIndexFromId(this.activeRunSurrounding.value.next);

      if (currentIndex >= 0) { // Found current run in array.
        if (currentIndex > 0) {
          [previous,, next] = this.array.value.slice(currentIndex - 1);
        } else { // We're at the start and can't splice -1.
          [, next] = this.array.value.slice(0);
        }
      } else if (previousIndex >= 0) { // Found previous run in array, use for reference.
        [previous,, next] = this.array.value.slice(previousIndex);
      } else if (nextIndex >= 0) { // Found next run in array, use for reference.
        [previous,, next] = this.array.value.slice(nextIndex - 2);
      }
    }

    this.activeRunSurrounding.value = {
      previous: (previous) ? previous.id : undefined,
      current: (current) ? current.id : undefined,
      next: (next) ? next.id : undefined,
    };
  }

  /**
   * Change the active run to the one specified if it exists.
   * @param id The unique ID of the run you wish to change to.
   */
  changeActiveRun(id?: string): Promise<void> {
    return new Promise(async (resolve, reject): Promise<void> => {
      const runData = this.array.value.find((run): boolean => run.id === id);
      if (['running', 'paused'].includes(this.timer.value.state)) {
        reject(new Error('Cannot change run while timer is running/paused.'));
      } else if (runData) {
        if (this.twitchAPIData.value.sync) {
          // Constructing Twitch title and game to send off.
          const status = this.h.bundleConfig().twitch.streamTitle
            .replace(new RegExp('{{game}}', 'g'), runData.game || '')
            .replace(new RegExp('{{players}}', 'g'), formPlayerNamesStr(runData))
            .replace(new RegExp('{{category}}', 'g'), runData.category || '');
          let game = runData.gameTwitch;
          [, game] = (!game)
            ? await to(events.sendMessage('srcomTwitchGameSearch', runData.game))
            : [null, game];
          [, game] = await to(events.sendMessage('twitchGameSearch', game));
          game = game || this.h.bundleConfig().twitch.streamDefaultGame;
          to(events.sendMessage('twitchUpdateChannelInfo', { status, game }));

          // Construct/send featured channels if enabled.
          if (this.h.bundleConfig().twitch.ffzIntegration) {
            to(events.sendMessage(
              'updateFeaturedChannels',
              getTwitchChannels(runData),
            ));
          }
        }
        this.activeRun.value = clone(runData);
        this.h.nodecg.sendMessage('timerReset', true);
        resolve();
      } else if (!id) {
        reject(new Error('Cannot change run as no run ID was supplied.'));
      } else {
        reject(new Error(`Cannot change run as a run with ID ${id} was not found.`));
      }
    });
  }

  /**
   * Deletes a run from the run data array.
   * @param id The unique ID of the run you wish to delete.
   */
  removeRun(id?: string): Promise<void> {
    return new Promise((resolve, reject): void => {
      const runIndex = this.array.value.findIndex((run): boolean => run.id === id);
      if (runIndex >= 0) {
        this.array.value.splice(runIndex, 1);
        resolve();
      } else if (!id) {
        reject(new Error('Cannot delete run as no run ID was supplied.'));
      } else {
        reject(new Error(`Cannot delete run as a run with ID ${id} was not found.`));
      }
    });
  }

  /**
   * Either edits a run (if we currently have it) or adds it.
   * @param runData Run Data object.
   * @param prevID ID of the run that this run will be inserted after if applicable.
   */
  modifyRun(runData: RunData, prevID?: string): Promise<void> {
    return new Promise((resolve, reject): void => {
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
        reject(new Error('Cannot accept run data as team(s) are missing player(s).'));
        return;
      }

      // Check all players have names, if not throw an error.
      const allNamesAdded = data.teams.every((team): boolean => (
        team.players.every((player): boolean => !!player.name)
      ));
      if (!allNamesAdded) {
        reject(new Error('Cannot accept run data as player(s) are missing name(s).'));
        return;
      }

      // Verify and convert estimate.
      if (data.estimate) {
        if (data.estimate.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
          const ms = timeStrToMS(data.estimate);
          data.estimate = msToTimeStr(ms);
          data.estimateS = ms / 1000;
        } else { // Throw error if format is incorrect.
          reject(new Error('Cannot accept run data as estimate is in incorrect format.'));
          return;
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
          reject(new Error('Cannot accept run data as setup time is in incorrect format.'));
          return;
        }
      } else {
        delete data.setupTime;
        delete data.setupTimeS;
      }

      const index = this.h.findRunIndexFromId(data.id);
      if (index >= 0) { // Run already exists, edit it.
        if (this.activeRun.value && data.id === this.activeRun.value.id) {
          this.activeRun.value = clone(data);
        }
        this.array.value[index] = clone(data);
      } else { // Run is new, add it.
        const prevIndex = this.h.findRunIndexFromId(prevID);
        this.array.value.splice(prevIndex + 1 || this.array.value.length, 0, clone(data));
      }

      resolve();
    });
  }

  /**
   * Removes the active run from the relevant replicant.
   */
  removeActiveRun(): Promise<void> {
    return new Promise((resolve, reject): void => {
      if (['running', 'paused'].includes(this.timer.value.state)) {
        reject(new Error('Cannot change run while timer is running/paused.'));
      } else {
        this.activeRun.value = null;
        this.h.nodecg.sendMessage('timerReset', true);
        resolve();
      }
    });
  }

  /**
   * Removes all runs in the array and the currently active run.
   */
  removeAllRuns(): Promise<void> {
    return new Promise((resolve, reject): void => {
      if (['running', 'paused'].includes(this.timer.value.state)) {
        reject(new Error('Cannot remove all runs while timer is running/paused.'));
      } else {
        this.array.value.length = 0;
        this.removeActiveRun();
        this.h.nodecg.sendMessage('timerReset', true);
        resolve();
      }
    });
  }
}
