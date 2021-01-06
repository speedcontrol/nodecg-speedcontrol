import clone from 'clone';
import type { ReplicantBrowser } from 'nodecg/types/browser';
import type { RunDataActiveRun } from 'schemas';
import type { RunDataTeam } from 'types';
import Vue from 'vue';
import Vuex, { Store } from 'vuex';

Vue.use(Vuex);

// Replicants and their types
const reps: {
  runDataActiveRun: ReplicantBrowser<RunDataActiveRun>;
  [k: string]: ReplicantBrowser<unknown>;
} = {
  runDataActiveRun: nodecg.Replicant('runDataActiveRun'),
};

// Types for mutations below
export type UpdateTeamOrder = (teams: RunDataTeam[]) => void;

const store = new Vuex.Store({
  state: {},
  mutations: {
    setState(state, { name, val }): void {
      Vue.set(state, name, val);
    },
    /* Mutations to replicants start */
    updateTeamOrder(state, teams: RunDataTeam[]): void {
      if (typeof reps.runDataActiveRun.value !== 'undefined') {
        reps.runDataActiveRun.value.teams = teams;
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
