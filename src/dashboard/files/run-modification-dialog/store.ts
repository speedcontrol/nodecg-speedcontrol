import clone from 'clone';
import uuid from 'uuid/v4';
import Vue from 'vue';
import Vuex from 'vuex';
import { RunData, RunDataPlayer, RunDataTeam } from '../../../../types';
import Helpers from '../_misc/helpers';
import { store as repStore } from '../_misc/replicant-store';

const { msToTimeStr } = Helpers;

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
};

export default new Vuex.Store({
  state: {
    runData: clone(defaultRunData),
    mode: 'New' as Mode,
    prevID: undefined as string | undefined,
  },
  mutations: {
    updateRunData(state, { value }) {
      Vue.set(state, 'runData', clone(value));
    },
    updateMode(state, { value }) {
      Vue.set(state, 'mode', value);
    },
    setAsDuplicate(state) {
      Vue.set(state, 'prevID', state.runData.id);
      Vue.set(state.runData, 'id', uuid());
    },
    setPreviousRunID(state, { value }) {
      Vue.set(state, 'prevID', value);
    },
    resetRunData(state) {
      Vue.set(state, 'runData', clone(defaultRunData));
      if (repStore.state.defaultSetupTime) { // Fill in default setup time if available.
        Vue.set(state.runData, 'setupTimeS', repStore.state.defaultSetupTime);
        Vue.set(state.runData, 'setupTime', msToTimeStr(
          repStore.state.defaultSetupTime * 1000,
        ));
      }
      Vue.set(state.runData, 'id', uuid());
    },
    addNewTeam(state) {
      const teamData = clone(defaultTeam);
      teamData.id = uuid();

      // Adds an empty player as well for ease of use.
      const playerData = clone(defaultPlayer);
      playerData.id = uuid();
      playerData.teamID = teamData.id;
      teamData.players.push(playerData);

      state.runData.teams.push(teamData);
    },
    addNewPlayer(state, { teamID }) {
      const teamIndex = state.runData.teams.findIndex((team) => teamID === team.id);
      if (teamIndex >= 0) {
        const data = clone(defaultPlayer);
        data.id = uuid();
        data.teamID = teamID;
        state.runData.teams[teamIndex].players.push(data);
      }
    },
    removeTeam(state, { teamID }) {
      const teamIndex = state.runData.teams.findIndex((team) => teamID === team.id);
      if (teamIndex >= 0) {
        state.runData.teams.splice(teamIndex, 1);
      }
    },
    removePlayer(state, { teamID, id }) {
      const teamIndex = state.runData.teams.findIndex((team) => teamID === team.id);
      const playerIndex = (teamIndex >= 0)
        ? state.runData.teams[teamIndex].players.findIndex((player) => id === player.id) : -1;
      if (teamIndex >= 0 && playerIndex >= 0) {
        state.runData.teams[teamIndex].players.splice(playerIndex, 1);
      }
    },
  },
  actions: {
    saveRunData({ state }) {
      return new Promise(async (resolve, reject) => {
        try {
          await nodecg.sendMessage('modifyRun', {
            runData: state.runData,
            prevID: state.prevID,
          });
          Vue.set(state, 'prevID', undefined);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    },
  },
});
