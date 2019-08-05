import Vue from 'vue';
import Vuex from 'vuex';
import { RunData } from '../../../types';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    runData: {} as RunData,
  },
  mutations: {
    updateRunData(state, { name, value }) {
      Vue.set(state.runData, name, value);
    },
  },
});
