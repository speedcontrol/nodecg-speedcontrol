import clone from 'clone';
import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const replicantNames = ['runDataArray', 'runDataActiveRun'];
const replicants: any[] = [];

const store = new Vuex.Store({
  state: {
    runDataArray: [],
    runDataActiveRun: null,
  },
  mutations: {
    updateReplicant(state, { name, value }) {
      Vue.set(state, name, value);
    },
  },
});

replicantNames.forEach((name) => {
  const replicant = nodecg.Replicant(name);

  replicant.on('change', (newVal: any) => {
    store.commit('updateReplicant', {
      name: replicant.name,
      value: clone(newVal),
    });
  });

  replicants.push(replicant);
});

export default async function createStore() {
  return NodeCG.waitForReplicants(...replicants).then(() => store);
}
