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
    updateColumn(state, { name, value }) {
      Vue.set(state.opts.columns, name, value);
    },
    updateSplit(state, { value }) {
      Vue.set(state.opts, 'split', value);
    },
  },
});
