import { RunData, RunDataPlayer, RunDataTeam, RunModification } from '@nodecg-speedcontrol/types';
import type { DefaultSetupTime } from '@nodecg-speedcontrol/types/schemas';
import { ReplicantModule } from '@nodecg-speedcontrol/_misc/replicant_store';
import clone from 'clone';
import { v4 as uuid } from 'uuid';
import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import { msToTimeStr } from '../_misc/helpers';

Vue.use(Vuex);

const defaultRunData: RunData = {
  teams: [],
  customData: {},
  id: uuid(),
};

const defaultTeam: RunDataTeam = {
  id: uuid(),
  players: [],
};

const defaultPlayer: RunDataPlayer = {
  id: uuid(),
  teamID: '',
  name: '',
  social: {},
  customData: {},
};

@Module({ name: 'OurModule' })
class OurModule extends VuexModule {
  public runData = clone(defaultRunData);
  public mode: RunModification.Mode = 'New';
  public updateTwitchBool = false;
  public prevID: string | null = null;
  defaultSetupTime: DefaultSetupTime = 0;

  @Mutation
  updateRunDataProp({ key, val }: { key: string, val: unknown }): void {
    Vue.set(this.runData, key, val);
  }

  @Mutation
  updateTeamDataProp({ id, key, val }: { id: string, key: string, val: unknown }): void {
    const teamIndex = this.runData.teams.findIndex((t) => t.id === id);
    if (teamIndex >= 0) Vue.set(this.runData.teams[teamIndex], key, val);
  }

  @Mutation
  updatePlayerDataProp(
    { teamId, id, key, val }: { teamId: string, id: string, key: string, val: unknown },
  ): void {
    const teamIndex = this.runData.teams.findIndex((t) => t.id === teamId);
    const playerIndex = this.runData.teams[teamIndex]?.players.findIndex((p) => p.id === id);
    if (playerIndex >= 0) Vue.set(this.runData.teams[teamIndex]?.players[playerIndex], key, val);
  }

  @Mutation
  updateRunData(runData: RunData): void {
    Vue.set(this, 'runData', clone(runData));
    Vue.set(this, 'updateTwitchBool', false);
  }

  @Mutation
  updateMode(mode: RunModification.Mode): void {
    Vue.set(this, 'mode', mode);
  }

  @Mutation
  updateTwitch(toggle: boolean): void {
    Vue.set(this, 'updateTwitchBool', toggle);
  }

  @Mutation
  setAsDuplicate(): void {
    Vue.set(this, 'prevID', this.runData.id);
    Vue.set(this.runData, 'id', uuid());
    Vue.delete(this.runData, 'scheduled');
    Vue.delete(this.runData, 'scheduledS');
    Vue.delete(this.runData, 'externalID');
  }

  @Mutation
  setPreviousRunID(id?: string): void {
    Vue.set(this, 'prevID', id ?? null);
  }

  @Mutation
  resetRunData(): void {
    Vue.set(this, 'runData', clone(defaultRunData));
    if (this.defaultSetupTime) { // Fill in default setup time if available.
      Vue.set(this.runData, 'setupTimeS', this.defaultSetupTime);
      Vue.set(this.runData, 'setupTime', msToTimeStr(this.defaultSetupTime * 1000));
    }
    Vue.set(this.runData, 'id', uuid());
    Vue.set(this, 'updateTwitchBool', false);
  }

  @Mutation
  addNewTeam(): void {
    const teamData = clone(defaultTeam);
    teamData.id = uuid();

    // Adds an empty player as well for ease of use.
    const playerData = clone(defaultPlayer);
    playerData.id = uuid();
    playerData.teamID = teamData.id;
    teamData.players.push(playerData);

    this.runData.teams.push(teamData);
  }

  @Mutation
  addNewPlayer(teamID: string): void {
    const teamIndex = this.runData.teams.findIndex((team) => teamID === team.id);
    if (teamIndex >= 0) {
      const data = clone(defaultPlayer);
      data.id = uuid();
      data.teamID = teamID;
      this.runData.teams[teamIndex].players.push(data);
    }
  }

  @Mutation
  removeTeam(teamID: string): void {
    const teamIndex = this.runData.teams.findIndex((team) => teamID === team.id);
    if (teamIndex >= 0) {
      this.runData.teams.splice(teamIndex, 1);
    }
  }

  @Mutation
  removePlayer({ teamID, id }: { teamID: string, id: string }): void {
    const teamIndex = this.runData.teams.findIndex((team) => teamID === team.id);
    const playerIndex = (teamIndex >= 0)
      ? this.runData.teams[teamIndex].players.findIndex((player) => id === player.id) : -1;
    if (teamIndex >= 0 && playerIndex >= 0) {
      this.runData.teams[teamIndex].players.splice(playerIndex, 1);
    }
  }

  @Action({ rawError: true })
  async saveRunData(): Promise<boolean> {
    const noTwitchGame = await nodecg.sendMessage<boolean>('modifyRun', {
      runData: this.runData,
      prevID: this.prevID ?? undefined,
      updateTwitch: this.updateTwitchBool,
    });
    this.context.commit('setPreviousRunID');
    this.context.commit('updateTwitch', false);
    return noTwitchGame;
  }
}

const store = new Store({
  strict: process.env.NODE_ENV !== 'production',
  state: {},
  modules: { ReplicantModule, OurModule },
});
export default store;
export const storeModule = getModule(OurModule, store);
