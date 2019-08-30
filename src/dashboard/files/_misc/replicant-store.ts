import clone from 'clone';
import { ReplicantBrowser } from 'nodecg/types/browser'; // eslint-disable-line
import Vue from 'vue';
import Vuex from 'vuex';
import { DefaultSetupTime, HoraroImportStatus, RunDataActiveRunSurrounding, TimerChangesDisabled, TwitchAPIData, TwitchChannelInfo } from '../../../../schemas'; // eslint-disable-line
import { RunDataActiveRun, RunDataArray, Timer } from '../../../../types';

Vue.use(Vuex);

const replicantNames = [
  'runDataArray',
  'runDataActiveRun',
  'runDataActiveRunSurrounding',
  'horaroImportStatus',
  'defaultSetupTime',
  'timer',
  'timerChangesDisabled',
  'twitchAPIData',
  'twitchChannelInfo',
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
    timerChangesDisabled: false as TimerChangesDisabled,
    twitchAPIData: {} as TwitchAPIData,
    twitchChannelInfo: {} as TwitchChannelInfo,
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
    updateTwitchSyncToggle(state, { value }) {
      const rep = replicants.find(repObj => repObj.name === 'twitchAPIData') as ReplicantBrowser<TwitchAPIData>;
      if (rep.value) {
        Vue.set(state.twitchAPIData, 'sync', value);
        rep.value.sync = value;
      }
    },
    updateTimerDisabledToggle(state, { value }) {
      const rep = replicants.find(repObj => repObj.name === 'timerChangesDisabled') as ReplicantBrowser<TimerChangesDisabled>;
      if (typeof rep.value === 'boolean') {
        Vue.set(state, 'timerChangesDisabled', value);
        rep.value = value;
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
