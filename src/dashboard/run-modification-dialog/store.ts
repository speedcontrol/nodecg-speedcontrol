import clone from 'clone';
import uuid from 'uuid/v4';
import Vue from 'vue';
import Vuex from 'vuex';
import { RunData, RunDataPlayer, RunDataTeam } from '../../../types';

Vue.use(Vuex);

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
    runListUpdate: false,
    activeRunUpdate: false,
  },
  mutations: {
    updateRunData(state, { value }) {
      Vue.set(state, 'runData', clone(value));
      Vue.set(state, 'runListUpdate', false);
      Vue.set(state, 'activeRunUpdate', false);
    },
    resetRunData(state) {
      Vue.set(state, 'runData', clone(defaultRunData));
      Vue.set(state.runData, 'id', uuid());
      Vue.set(state, 'runListUpdate', false);
      Vue.set(state, 'activeRunUpdate', false);
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
      const teamIndex = state.runData.teams.findIndex(team => teamID === team.id);
      if (teamIndex >= 0) {
        const data = clone(defaultPlayer);
        data.id = uuid();
        data.teamID = teamID;
        state.runData.teams[teamIndex].players.push(data);
      }
    },
    removeTeam(state, { teamID }) {
      const teamIndex = state.runData.teams.findIndex(team => teamID === team.id);
      if (teamIndex >= 0) {
        state.runData.teams.splice(teamIndex, 1);
      }
    },
    removePlayer(state, { teamID, id }) {
      const teamIndex = state.runData.teams.findIndex(team => teamID === team.id);
      const playerIndex = (teamIndex >= 0)
        ? state.runData.teams[teamIndex].players.findIndex(player => id === player.id) : -1;
      if (teamIndex >= 0 && playerIndex >= 0) {
        state.runData.teams[teamIndex].players.splice(playerIndex, 1);
      }
    },
    toggleRunListUpdateBool(state, { value }) {
      Vue.set(state, 'runListUpdate', value);
    },
    toggleActiveRunUpdateBool(state, { value }) {
      Vue.set(state, 'activeRunUpdate', value);
    },
  },
  actions: {
    saveRunData(context) {
      nodecg.sendMessage(
        'modifyRun',
        {
          runData: context.state.runData,
          runListUpdate: context.state.runListUpdate,
          activeRunUpdate: context.state.activeRunUpdate,
        },
      ).then(() => {
        // done
      }).catch(() => {
        // failed
      });
    },
  },
});
