import clone from 'clone';
import type { ReplicantBrowser } from 'nodecg/types/browser';
import type { RunDataActiveRun, Timer, TimerChangesDisabled } from 'schemas';
import Vue from 'vue';
import Vuex, { Store } from 'vuex';

Vue.use(Vuex);

// Replicants and their types
const reps: {
  runDataActiveRun: ReplicantBrowser<RunDataActiveRun>;
  timer: ReplicantBrowser<Timer>;
  timerChangesDisabled: ReplicantBrowser<TimerChangesDisabled>;
  [k: string]: ReplicantBrowser<unknown>;
} = {
  runDataActiveRun: nodecg.Replicant('runDataActiveRun'),
  timer: nodecg.Replicant('timer'),
  timerChangesDisabled: nodecg.Replicant('timerChangesDisabled'),
};

// Types for mutations below
export type UpdateDisabledToggle = (toggle: boolean) => void;

const store = new Vuex.Store({
  state: {},
  mutations: {
    setState(state, { name, val }): void {
      Vue.set(state, name, val);
    },
    /* Mutations to replicants start */
    updateDisabledToggle(state, toggle: boolean): void {
      if (typeof reps.timerChangesDisabled.value !== 'undefined') {
        reps.timerChangesDisabled.value = toggle;
      }
    },
    /* Mutations to replicants end */
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
