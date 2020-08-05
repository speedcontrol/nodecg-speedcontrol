import clone from 'clone';
import type { ReplicantBrowser } from 'nodecg/types/browser';
import type { DefaultSetupTime, TwitchAPIData } from 'schemas';
import { RunData, RunDataPlayer, RunDataTeam } from 'types';
import { v4 as uuid } from 'uuid';
import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import { msToTimeStr } from '../_misc/helpers';

Vue.use(Vuex);

enum Mode {
  New = 'New',
  EditActive = 'EditActive',
  EditOther = 'EditOther',
  Duplicate = 'Duplicate',
}

const defaultRunData: RunData = {
  teams: [],
  customData: {},
  id: uuid(),
};

const defaultTeam: RunDataTeam = {
  id: uuid(),
  players: [],
};

const defaultPlayer: RunDataPlayer = {
  id: uuid(),
  teamID: '',
  name: '',
  social: {},
  customData: {},
};

// Replicants and their types
const reps: {
  twitchAPIData: ReplicantBrowser<TwitchAPIData>;
  defaultSetupTime: ReplicantBrowser<DefaultSetupTime>;
  [k: string]: ReplicantBrowser<unknown>;
} = {
  twitchAPIData: nodecg.Replicant('twitchAPIData'),
  defaultSetupTime: nodecg.Replicant('defaultSetupTime'),
};

// Types for mutations below
export type UpdateRunData = (runData: RunData) => void;
export type UpdateMode = (mode: Mode) => void;
export type UpdateTwitch = (toggle: boolean) => void;
export type SetAsDuplicate = () => void;
export type SetPreviousRunID = (id: string) => void;
export type ResetRunData = () => void;
export type AddNewTeam = () => void;
export type AddNewPlayer = (teamID: string) => void;
export type RemoveTeam = (teamID: string) => void;
export type RemovePlayer = (opts: { teamID: string, id: string }) => void;
export type SaveRunData = () => Promise<boolean>;

const store = new Vuex.Store({
  state: {
    runData: clone(defaultRunData),
    mode: 'New' as Mode,
    prevID: undefined as string | undefined,
    updateTwitch: false,
    defaultSetupTime: 0 as DefaultSetupTime,
  },
  mutations: {
    setState(state, { name, val }): void {
      Vue.set(state, name, val);
    },
    updateRunData(state, runData: RunData): void {
      Vue.set(state, 'runData', clone(runData));
      Vue.set(state, 'updateTwitch', false);
    },
    updateMode(state, mode: Mode): void {
      Vue.set(state, 'mode', mode);
    },
    updateTwitch(state, toggle: boolean): void {
      Vue.set(state, 'updateTwitch', toggle);
    },
    setAsDuplicate(state): void {
      Vue.set(state, 'prevID', state.runData.id);
      Vue.set(state.runData, 'id', uuid());
      Vue.delete(state.runData, 'scheduled');
      Vue.delete(state.runData, 'scheduledS');
      Vue.delete(state.runData, 'externalID');
    },
    setPreviousRunID(state, id: string): void {
      Vue.set(state, 'prevID', id);
    },
    resetRunData(state): void {
      Vue.set(state, 'runData', clone(defaultRunData));
      if (state.defaultSetupTime) { // Fill in default setup time if available.
        Vue.set(state.runData, 'setupTimeS', state.defaultSetupTime);
        Vue.set(state.runData, 'setupTime', msToTimeStr(
          state.defaultSetupTime * 1000,
        ));
      }
      Vue.set(state.runData, 'id', uuid());
      Vue.set(state, 'updateTwitch', false);
    },
    addNewTeam(state): void {
      const teamData = clone(defaultTeam);
      teamData.id = uuid();

      // Adds an empty player as well for ease of use.
      const playerData = clone(defaultPlayer);
      playerData.id = uuid();
      playerData.teamID = teamData.id;
      teamData.players.push(playerData);

      state.runData.teams.push(teamData);
    },
    addNewPlayer(state, teamID: string): void {
      const teamIndex = state.runData.teams.findIndex((team) => teamID === team.id);
      if (teamIndex >= 0) {
        const data = clone(defaultPlayer);
        data.id = uuid();
        data.teamID = teamID;
        state.runData.teams[teamIndex].players.push(data);
      }
    },
    removeTeam(state, teamID: string): void {
      const teamIndex = state.runData.teams.findIndex((team) => teamID === team.id);
      if (teamIndex >= 0) {
        state.runData.teams.splice(teamIndex, 1);
      }
    },
    removePlayer(state, { teamID, id }: { teamID: string, id: string }): void {
      const teamIndex = state.runData.teams.findIndex((team) => teamID === team.id);
      const playerIndex = (teamIndex >= 0)
        ? state.runData.teams[teamIndex].players.findIndex((player) => id === player.id) : -1;
      if (teamIndex >= 0 && playerIndex >= 0) {
        state.runData.teams[teamIndex].players.splice(playerIndex, 1);
      }
    },
  },
  actions: {
    async saveRunData({ state }): Promise<boolean> {
      const noTwitchGame = await nodecg.sendMessage('modifyRun', {
        runData: state.runData,
        prevID: state.prevID,
        updateTwitch: state.updateTwitch,
      });
      Vue.set(state, 'prevID', undefined);
      Vue.set(state, 'updateTwitch', false);
      return noTwitchGame;
    },
  },
});

Object.keys(reps).forEach((key) => {
  reps[key].on('change', (val) => {
    store.commit('setState', { name: key, val: clone(val) });
  });
});

export default async (): Promise<Store<Record<string, unknown>>> => {
  await NodeCG.waitForReplicants(...Object.keys(reps).map((key) => reps[key]));
  return store;
};
