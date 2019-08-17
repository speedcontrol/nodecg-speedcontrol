import clone from 'clone';
import { ReplicantBrowser } from 'nodecg/types/browser'; // eslint-disable-line
import Vue from 'vue';
import Vuex from 'vuex';
import { DefaultSetupTime, HoraroImportStatus, RunDataActiveRunSurrounding, TwitchAPIData, TwitchChannelData } from '../../../schemas'; // eslint-disable-line
import { RunDataActiveRun, RunDataArray, Timer } from '../../../types';

Vue.use(Vuex);

const replicantNames = [
  'runDataArray',
  'runDataActiveRun',
  'runDataActiveRunSurrounding',
  'horaroImportStatus',
  'defaultSetupTime',
  'timer',
  'twitchAPIData',
  'twitchChannelData',
];
const replicants: ReplicantBrowser<unknown>[] = [];

export const store = new Vuex.Store({
  state: {
    runDataArray: [] as RunDataArray,
    runDataActiveRun: null as RunDataActiveRun,
    runDataActiveRunSurrounding: {} as RunDataActiveRunSurrounding,
    horaroImportStatus: {} as HoraroImportStatus,
    defaultSetupTime: 0 as DefaultSetupTime,
    timer: {} as Timer,
    twitchAPIData: {} as TwitchAPIData,
    twitchChannelData: {} as TwitchChannelData,
  },
  mutations: {
    updateReplicant(state, { name, value }) {
      Vue.set(state, name, value);
    },
    updateActiveRunTeamOrder(state, { value }) {
      const rep = replicants.find(repObj => repObj.name === 'runDataActiveRun');
      if (state.runDataActiveRun && rep && rep.value) {
        Vue.set(state.runDataActiveRun, 'teams', value);
        rep.value = state.runDataActiveRun;
      }
    },
    updateRunOrder(state, { value }) {
      const rep = replicants.find(repObj => repObj.name === 'runDataArray');
      if (state.runDataArray && rep && rep.value) {
        Vue.set(state, 'runDataArray', value);
        rep.value = state.runDataArray;
      }
    },
  },
});

replicantNames.forEach((name) => {
  const replicant = nodecg.Replicant(name);

  replicant.on('change', (newVal) => {
    store.commit('updateReplicant', {
      name: replicant.name,
      value: clone(newVal),
    });
  });

  replicants.push(replicant);
});

export async function create() {
  return NodeCG.waitForReplicants(...replicants).then(() => store);
}
