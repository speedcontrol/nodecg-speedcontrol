import { HoraroImportSavedOpts } from '@nodecg-speedcontrol/types/schemas';
import { replicantModule, ReplicantModule, ReplicantTypes } from '@nodecg-speedcontrol/_misc/replicant_store';
import clone from 'clone';
import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import { getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';

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

@Module({ name: 'OurModule' })
class OurModule extends VuexModule {
  public opts = clone(defaultOpts);

  // Helper getter to return all replicants.
  get reps(): ReplicantTypes {
    return this.context.rootState.ReplicantModule.reps;
  }

  @Mutation
  saveOpts(): void {
    replicantModule.setReplicant<HoraroImportSavedOpts>({
      name: 'horaroImportSavedOpts', val: clone(this.opts),
    });
  }

  @Mutation
  updateColumn(
    { name, value, custom }: { name: string, value: number | null, custom: boolean },
  ): void {
    if (custom) {
      Vue.set(this.opts.columns.custom, name, value);
    } else {
      Vue.set(this.opts.columns, name, value);
    }
  }

  @Mutation
  updateSplit(split: number): void {
    Vue.set(this.opts, 'split', split);
  }

  @Mutation
  addCustomColumn(name: string): void {
    Vue.set(this.opts.columns.custom, name, null);
  }

  @Mutation
  loadOpts(): void {
    const reps = replicantModule.reps as unknown as ReplicantTypes;
    Vue.set(this, 'opts', clone(reps.horaroImportSavedOpts));
  }

  @Mutation
  clearOpts(): void {
    Vue.set(this, 'opts', clone(defaultOpts));
  }
}

const store = new Store({
  strict: process.env.NODE_ENV !== 'production',
  state: {},
  modules: { ReplicantModule, OurModule },
});
export default store;
export const storeModule = getModule(OurModule, store);
