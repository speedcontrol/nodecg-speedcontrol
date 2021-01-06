import clone from 'clone';
import type { ReplicantBrowser } from 'nodecg/types/browser';
import type { HoraroImportSavedOpts, HoraroImportStatus, RunDataActiveRun } from 'schemas';
import Vue from 'vue';
import Vuex, { Store } from 'vuex';

Vue.use(Vuex);

export interface Opts {
  columns: {
    game: number | null;
    gameTwitch: number | null;
    category: number | null;
    system: number | null;
    region: number | null;
    release: number | null;
    player: number | null;
    externalID: number | null;
    custom: {
      [k: string]: number | null;
    };
  };
  split: 0 | 1;
}

const defaultOpts: Opts = {
  columns: {
    game: null,
    gameTwitch: null,
    category: null,
    system: null,
    region: null,
    release: null,
    player: null,
    externalID: null,
    custom: {},
  },
  split: 0,
};

// Replicants and their types
const reps: {
  runDataActiveRun: ReplicantBrowser<RunDataActiveRun>;
  horaroImportStatus: ReplicantBrowser<HoraroImportStatus>;
  horaroImportSavedOpts: ReplicantBrowser<HoraroImportSavedOpts>;
  [k: string]: ReplicantBrowser<unknown>;
} = {
  runDataActiveRun: nodecg.Replicant('runDataActiveRun'),
  horaroImportStatus: nodecg.Replicant('horaroImportStatus'),
  horaroImportSavedOpts: nodecg.Replicant('horaroImportSavedOpts'),
};

// Types for mutations below
export type SaveOpts = () => void;
export type UpdateColumn = (opts: { name: string, value: number | null, custom: boolean }) => void;
export type UpdateSplit = (split: number) => void;
export type AddCustomColumn = (name: string) => void;
export type LoadOpts = () => void;
export type ClearOpts = () => void;

const store = new Vuex.Store({
  state: {
    opts: clone(defaultOpts),
  } as {
    opts: typeof defaultOpts,
    horaroImportSavedOpts: HoraroImportSavedOpts,
  },
  mutations: {
    setState(state, { name, val }): void {
      Vue.set(state, name, val);
    },
    /* Mutations to replicants start */
    saveOpts(state): void {
      if (typeof reps.horaroImportSavedOpts.value !== 'undefined') {
        reps.horaroImportSavedOpts.value = clone(state.opts);
      }
    },
    /* Mutations to replicants end */
    updateColumn(
      state,
      { name, value, custom }: { name: string, value: number | null, custom: boolean },
    ): void {
      if (custom) {
        Vue.set(state.opts.columns.custom, name, value);
      } else {
        Vue.set(state.opts.columns, name, value);
      }
    },
    updateSplit(state, split: number): void {
      Vue.set(state.opts, 'split', split);
    },
    addCustomColumn(state, name: string): void {
      Vue.set(state.opts.columns.custom, name, null);
    },
    loadOpts(state): void {
      Vue.set(state, 'opts', clone(state.horaroImportSavedOpts));
    },
    clearOpts(state): void {
      Vue.set(state, 'opts', clone(defaultOpts));
      store.commit('saveOpts');
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
