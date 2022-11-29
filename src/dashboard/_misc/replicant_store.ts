import { RunDataActiveRun, RunFinishTimes } from '@nodecg-speedcontrol/types';
import type { DefaultSetupTime, HoraroImportSavedOpts, HoraroImportStatus, OengusImportStatus, RunDataActiveRunSurrounding, RunDataArray, Timer, TimerChangesDisabled, TwitchAPIData, TwitchChannelInfo, TwitchCommercialTimer } from '@nodecg-speedcontrol/types/schemas';
import clone from 'clone';
import { default as NodeCGTypes } from '@alvancamp/test-nodecg-types'; // eslint-disable-lint import/no-named-default
import Vue from 'vue';
import type { Store } from 'vuex';
import { namespace } from 'vuex-class';
import { getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';

// Declaring replicants.
export const reps: {
  defaultSetupTime: NodeCGTypes.ClientReplicant<DefaultSetupTime>;
  horaroImportSavedOpts: NodeCGTypes.ClientReplicant<HoraroImportSavedOpts>;
  horaroImportStatus: NodeCGTypes.ClientReplicant<HoraroImportStatus>;
  oengusImportStatus: NodeCGTypes.ClientReplicant<OengusImportStatus>;
  runDataActiveRun: NodeCGTypes.ClientReplicant<RunDataActiveRun>;
  runDataActiveRunSurrounding: NodeCGTypes.ClientReplicant<RunDataActiveRunSurrounding>;
  runDataArray: NodeCGTypes.ClientReplicant<RunDataArray>;
  runFinishTimes: NodeCGTypes.ClientReplicant<RunFinishTimes>;
  timer: NodeCGTypes.ClientReplicant<Timer>;
  timerChangesDisabled: NodeCGTypes.ClientReplicant<TimerChangesDisabled>;
  twitchAPIData: NodeCGTypes.ClientReplicant<TwitchAPIData>;
  twitchChannelInfo: NodeCGTypes.ClientReplicant<TwitchChannelInfo>;
  twitchCommercialTimer: NodeCGTypes.ClientReplicant<TwitchCommercialTimer>;
  [k: string]: NodeCGTypes.ClientReplicant<unknown>;
} = {
  defaultSetupTime: nodecg.Replicant('defaultSetupTime'),
  horaroImportSavedOpts: nodecg.Replicant('horaroImportSavedOpts'),
  horaroImportStatus: nodecg.Replicant('horaroImportStatus'),
  oengusImportStatus: nodecg.Replicant('oengusImportStatus'),
  runDataActiveRun: nodecg.Replicant('runDataActiveRun'),
  runDataActiveRunSurrounding: nodecg.Replicant('runDataActiveRunSurrounding'),
  runDataArray: nodecg.Replicant('runDataArray'),
  runFinishTimes: nodecg.Replicant('runFinishTimes'),
  timer: nodecg.Replicant('timer'),
  timerChangesDisabled: nodecg.Replicant('timerChangesDisabled'),
  twitchAPIData: nodecg.Replicant('twitchAPIData'),
  twitchChannelInfo: nodecg.Replicant('twitchChannelInfo'),
  twitchCommercialTimer: nodecg.Replicant('twitchCommercialTimer'),
};

// All the replicant types.
export interface ReplicantTypes {
  defaultSetupTime: DefaultSetupTime;
  horaroImportSavedOpts: HoraroImportSavedOpts;
  horaroImportStatus: HoraroImportStatus;
  oengusImportStatus: OengusImportStatus;
  runDataActiveRun: RunDataActiveRun;
  runDataActiveRunSurrounding: RunDataActiveRunSurrounding;
  runDataArray: RunDataArray;
  runFinishTimes: RunFinishTimes;
  timer: Timer;
  timerChangesDisabled: TimerChangesDisabled;
  twitchAPIData: TwitchAPIData;
  twitchChannelInfo: TwitchChannelInfo;
  twitchCommercialTimer: TwitchCommercialTimer;
}

@Module({ name: 'ReplicantModule', namespaced: true })
export class ReplicantModule extends VuexModule {
  // Replicant values are stored here.
  public reps: { [k: string]: unknown } = {};

  // This sets the state object above when a replicant sends an update.
  @Mutation
  setState({ name, val }: { name: string, val: unknown }): void {
    Vue.set(this.reps, name, clone(val));
  }

  // This is a generic mutation to update a named replicant.
  // If the replicant is an object type, it'll merge in differences if needed.
  @Mutation
  setReplicant<K>(
    { name, val, merge = true }: { name: string, val: Partial<K>, merge?: boolean },
  ): void {
    const rep = this.reps[name];
    let merged = val;
    if (rep && merge && typeof rep === 'object' && !Array.isArray(rep)) {
      merged = { ...clone(rep), ...val };
    }
    Vue.set(this.reps, name, clone(merged)); // Also update local copy, no schema validation!
    reps[name].value = clone(merged);
  }
}

// eslint-disable-next-line import/no-mutable-exports
export let replicantModule!: ReplicantModule;
export const replicantNS = namespace('ReplicantModule');

export async function setUpReplicants(store: Store<unknown>): Promise<void> {
  // Listens for each declared replicants "change" event, and updates the state.
  Object.keys(reps).forEach((name) => {
    reps[name].on('change', (val) => {
      store.commit('ReplicantModule/setState', { name, val });
    });
  });
  // We should make sure the replicant are ready to be read, needs to be done in browser context.
  await NodeCG.waitForReplicants(...Object.keys(reps).map((key) => reps[key]));
  replicantModule = getModule(ReplicantModule, store);
}
