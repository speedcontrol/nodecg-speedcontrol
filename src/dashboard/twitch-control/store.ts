import clone from 'clone';
import type { ReplicantBrowser } from 'nodecg/types/browser';
import type { TwitchAPIData, TwitchChannelInfo, TwitchCommercialTimer } from 'schemas';
import Vue from 'vue';
import Vuex, { Store } from 'vuex';

Vue.use(Vuex);

// Replicants and their types
const reps: {
  twitchAPIData: ReplicantBrowser<TwitchAPIData>;
  twitchChannelInfo: ReplicantBrowser<TwitchChannelInfo>;
  twitchCommercialTimer: ReplicantBrowser<TwitchCommercialTimer>;
  [k: string]: ReplicantBrowser<unknown>;
} = {
  twitchAPIData: nodecg.Replicant('twitchAPIData'),
  twitchChannelInfo: nodecg.Replicant('twitchChannelInfo'),
  twitchCommercialTimer: nodecg.Replicant('twitchCommercialTimer'),
};

// Types for mutations below
export type UpdateTwitchSyncToggle = (sync: boolean) => void;

const store = new Vuex.Store({
  state: {},
  mutations: {
    setState(state, { name, val }): void {
      Vue.set(state, name, val);
    },
    /* Mutations to replicants start */
    updateTwitchSyncToggle(state, sync: boolean): void {
      if (typeof reps.twitchAPIData.value !== 'undefined') {
        reps.twitchAPIData.value.sync = sync;
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
