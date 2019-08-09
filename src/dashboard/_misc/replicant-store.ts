import clone from 'clone';
import { ReplicantBrowser } from 'nodecg/types/browser'; // eslint-disable-line
import Vue from 'vue';
import Vuex from 'vuex';
import { RunDataSurroundingRuns } from '../../../schemas';
import { RunDataActiveRun, RunDataArray, Timer } from '../../../types';

Vue.use(Vuex);

const replicantNames = [
  'runDataArray',
  'runDataActiveRun',
  'runDataSurroundingRuns',
  'timer',
];
const replicants: ReplicantBrowser<unknown>[] = [];

export const store = new Vuex.Store({
  state: {
    runDataArray: [] as RunDataArray,
    runDataActiveRun: null as RunDataActiveRun,
    runDataSurroundingRuns: {} as RunDataSurroundingRuns,
    timer: {} as Timer,
  },
  mutations: {
    updateReplicant(state, { name, value }) {
      Vue.set(state, name, value);
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
