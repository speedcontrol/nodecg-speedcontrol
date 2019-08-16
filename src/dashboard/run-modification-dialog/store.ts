import clone from 'clone';
import uuid from 'uuid/v4';
import Vue from 'vue';
import Vuex from 'vuex';
import { RunData } from '../../../types';

Vue.use(Vuex);

const defaultRunData: RunData = {
  teams: [],
  customData: {},
  id: uuid(),
};

export default new Vuex.Store({
  state: {
    runData: clone(defaultRunData),
  },
  mutations: {
    updateRunData(state, { value }) {
      Vue.set(state, 'runData', value);
    },
    resetRunData(state) {
      Vue.set(state, 'runData', clone(defaultRunData));
      Vue.set(state.runData, 'id', uuid());
    },
  },
});
