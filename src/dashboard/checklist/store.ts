import clone from 'clone';
import type { ReplicantBrowser } from 'nodecg/types/browser';
import type { Checklist } from 'schemas';
import Vue from 'vue';
import Vuex, { Store } from 'vuex';

Vue.use(Vuex);

// Replicants and their types
const reps: {
  checklist: ReplicantBrowser<Checklist>;
  [k: string]: ReplicantBrowser<unknown>;
} = {
  checklist: nodecg.Replicant('checklist'),
};

const store = new Vuex.Store({
  state: {
    checklist: [] as Checklist,
  },
  mutations: {
    setState(state, { name, val }): void {
      Vue.set(state, name, val);
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
