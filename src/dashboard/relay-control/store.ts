import { ReplicantModule } from '@nodecg-speedcontrol/_misc/replicant_store';
import Vue from 'vue';
import Vuex, { Store } from 'vuex';

Vue.use(Vuex);

export default new Store({
  strict: process.env.NODE_ENV !== 'production',
  state: {},
  modules: { ReplicantModule },
});
