import { TwitchAPIData } from '@nodecg-speedcontrol/types/schemas';
import { replicantModule, ReplicantModule } from '@nodecg-speedcontrol/_misc/replicant_store';
import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import { getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';

Vue.use(Vuex);

@Module({ name: 'OurModule' })
class OurModule extends VuexModule {
  @Mutation
  updateSyncToggle(sync: boolean): void {
    replicantModule.setReplicant<TwitchAPIData>({ name: 'twitchAPIData', val: { sync } });
  }
}

const store = new Store({
  strict: process.env.NODE_ENV !== 'production',
  state: {},
  modules: { ReplicantModule, OurModule },
});
export default store;
export const storeModule = getModule(OurModule, store);
