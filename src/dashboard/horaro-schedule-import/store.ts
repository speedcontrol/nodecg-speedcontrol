import clone from 'clone';
import Vue from 'vue';
import Vuex from 'vuex';
import { store as repStore } from '../_misc/replicant-store';

Vue.use(Vuex);

const defaultOpts = {
  columns: {
    game: null,
    gameTwitch: null,
    category: null,
    system: null,
    region: null,
    release: null,
    player: null,
    custom: {},
  },
  split: 0,
};

export default new Vuex.Store({
  state: {
    opts: clone(defaultOpts),
  },
  mutations: {
    updateColumn(state, { name, value, custom }): void {
      if (custom) {
        Vue.set(state.opts.columns.custom, name, value);
      } else {
        Vue.set(state.opts.columns, name, value);
      }
    },
    addCustomColumn(state, { name }): void {
      Vue.set(state.opts.columns.custom, name, null);
    },
    updateSplit(state, { value }): void {
      Vue.set(state.opts, 'split', value);
    },
    saveOpts(state): void {
      repStore.commit('saveHoraroImportOpts', {
        value: clone(state.opts),
      });
    },
    loadOpts(state): void {
      Vue.set(state, 'opts', clone(repStore.state.horaroImportSavedOpts));
    },
    clearOpts(state): void {
      repStore.commit('saveHoraroImportOpts', {
        value: undefined,
      });
      Vue.set(state, 'opts', clone(defaultOpts));
    },
  },
});
