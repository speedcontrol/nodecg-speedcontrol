import type { RunDataTeam } from '@nodecg-speedcontrol/types';
import type { RunDataActiveRun } from '@nodecg-speedcontrol/types/schemas';
import { replicantModule, ReplicantModule } from '@nodecg-speedcontrol/_misc/replicant_store';
import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import { getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';

Vue.use(Vuex);

@Module({ name: 'OurModule' })
class OurModule extends VuexModule {
  @Mutation
  updateTeamOrder(teams: RunDataTeam[]): void {
    replicantModule.setReplicant<RunDataActiveRun>({ name: 'runDataActiveRun', val: { teams } });
  }
}

const store = new Store({
  strict: process.env.NODE_ENV !== 'production',
  state: {},
  modules: { ReplicantModule, OurModule },
});
export default store;
export const storeModule = getModule(OurModule, store);
