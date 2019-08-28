import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    opts: {
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
    },
  },
  mutations: {
    updateColumn(state, { name, value, custom }) {
      if (custom) {
        Vue.set(state.opts.columns.custom, name, value);
      } else {
        Vue.set(state.opts.columns, name, value);
      }
    },
    addCustomColumn(state, { name }) {
      Vue.set(state.opts.columns.custom, name, null);
    },
    updateSplit(state, { value }) {
      Vue.set(state.opts, 'split', value);
    },
  },
});
