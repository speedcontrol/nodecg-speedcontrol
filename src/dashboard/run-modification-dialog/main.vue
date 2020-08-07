<i18n>
{
  "en": {
    "addNewTeam": "Add New Team",
    "updateTwitch": "Update Twitch information"
  },
  "ja": {
    "addNewTeam": "チームの追加",
    "updateTwitch": "Twitchの情報を更新"
  }
}
</i18n>

<template>
  <v-app>
    <h1 v-if="mode === 'New'">
      {{ $t('addNewRun') }}
    </h1>
    <h1 v-else-if="mode === 'Duplicate'">
      {{ $t('duplicateRun') }}
    </h1>
    <h1 v-else>
      {{ $t('editRun') }}
    </h1>
    <v-alert
      v-if="err"
      type="error"
    >
      <!-- Errors are not being localised yet, they are from the server -->
      {{ err.message }}
    </v-alert>
    <div>
      <!-- Normal Inputs -->
      <div class="d-flex">
        <text-input
          v-model="runData.game"
          :label="$t('game')"
        />
        <text-input
          v-model="runData.category"
          :label="$t('category')"
          left-border
        />
      </div>
      <div class="d-flex">
        <text-input
          v-model="runData.region"
          :label="$t('region')"
        />
        <text-input
          v-model="runData.release"
          :label="$t('released')"
          left-border
        />
        <text-input
          v-model="runData.gameTwitch"
          :label="$t('gameTwitch')"
          left-border
        />
      </div>
      <div class="d-flex">
        <text-input
          v-model="runData.system"
          :label="$t('system')"
        />
        <text-input
          v-model="runData.estimate"
          :label="$t('estimate')"
          left-border
        />
        <text-input
          v-model="runData.setupTime"
          :label="$t('setupTime')"
          left-border
        />
      </div>
      <!-- Custom Data Inputs -->
      <div>
        <text-input
          v-for="data in customData"
          :key="data.key"
          v-model="runData.customData[data.key]"
          :label="data.name"
        />
      </div>
    </div>
    <div>
      <!-- Teams -->
      <draggable
        v-model="runData.teams"
        handle=".TeamHandle"
      >
        <transition-group name="list">
          <team
            v-for="team in runData.teams"
            :key="team.id"
            :team-data="team"
          />
        </transition-group>
      </draggable>
    </div>
    <div
      class="d-flex"
      :style="{ 'margin-top': '20px' }"
    >
      <modify-button
        class="mr-auto"
        icon="mdi-account-multiple-plus"
        :tooltip="$t('addNewTeam')"
        @click="addNewTeam"
      />
      <v-checkbox
        v-if="mode === 'EditActive' && twitchAPIData.state === 'on'"
        v-model="updateTwitch"
        class="ma-0 pa-0 align-center justify-center"
        hide-details
        :label="$t('updateTwitch')"
      />
      <v-btn
        :style="{ 'margin-left': '10px' }"
        @click="attemptSave"
      >
        {{ $t('ok') }}
      </v-btn>
      <v-btn
        :style="{ 'margin-left': '10px' }"
        @click="close(false)"
      >
        {{ $t('cancel') }}
      </v-btn>
    </div>
  </v-app>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import { State, Mutation, Action } from 'vuex-class';
import { State2Way } from 'vuex-class-state2way';
import { TwitchAPIData } from 'schemas';
import { Configschema } from 'configschema';
import Draggable from 'vuedraggable';
import { RunData, RunModification, Dialog, Alert } from 'types';
import TextInput from './components/TextInput.vue';
import Team from './components/Team.vue';
import ModifyButton from './components/ModifyButton.vue';
import { SaveRunData, UpdateRunData, SetAsDuplicate, SetPreviousRunID, ResetRunData, AddNewTeam } from './store'; // eslint-disable-line object-curly-newline, max-len

@Component({
  components: {
    Draggable,
    TextInput,
    Team,
    ModifyButton,
  },
})
export default class extends Vue {
  @Mutation updateRunData!: UpdateRunData;
  @Mutation setAsDuplicate!: SetAsDuplicate;
  @Mutation setPreviousRunID!: SetPreviousRunID;
  @Mutation resetRunData!: ResetRunData;
  @Mutation addNewTeam!: AddNewTeam;
  @Action saveRunData!: SaveRunData;
  @State twitchAPIData!: TwitchAPIData;
  @State2Way('updateMode', 'mode') mode!: RunModification.Mode;
  @State2Way('updateTwitch', 'updateTwitch') updateTwitch!: boolean;
  @State2Way('updateRunData', 'runData') runData!: RunData;
  dialog!: Dialog;
  err: Error | null = null;

  get customData(): { name: string, key: string, ignoreMarkdown?: boolean }[] {
    return (nodecg.bundleConfig as Configschema).schedule.customData || [];
  }

  open(opts: { mode: RunModification.Mode, runData?: RunData, prevID?: string }): void {
    // Waits for dialog to actually open before changing storage.
    this.dialog.open();
    document.addEventListener('dialog-opened', () => {
      this.mode = opts.mode;
      this.err = null;
      if (opts.runData) {
        this.updateRunData(opts.runData);
        if (opts.mode === 'Duplicate') {
          this.setAsDuplicate();
        }
      } else if (opts.mode === 'New') {
        this.setPreviousRunID(opts.prevID);
        this.resetRunData();
        this.addNewTeam();
      }
    }, { once: true });
    document.addEventListener('dialog-confirmed', this.confirm, { once: true });
    document.addEventListener('dialog-dismissed', this.dismiss, { once: true });
  }

  async attemptSave(): Promise<void> {
    this.err = null;
    try {
      const noTwitchGame = await this.saveRunData();
      this.close(true);
      if (noTwitchGame) {
        const dialog = nodecg.getDialog('alert-dialog') as Dialog;
        const frame = dialog.querySelector('iframe');
        if (frame) {
          (frame.contentWindow as Alert.Dialog).openDialog({
            name: 'NoTwitchGame',
          });
        }
      }
    } catch (err) {
      this.err = err;
    }
  }

  close(confirm: boolean): void {
    this.dialog._updateClosingReasonConfirmed(confirm); // eslint-disable-line no-underscore-dangle
    this.dialog.close();
  }

  confirm(): void {
    document.removeEventListener('dialog-dismissed', this.dismiss);
  }

  dismiss(): void {
    document.removeEventListener('dialog-confirmed', this.confirm);
  }

  mounted(): void {
    this.dialog = nodecg.getDialog('run-modification-dialog') as Dialog;

    // Attaching this function to the window for easy access from dashboard panels.
    (window as Window as RunModification.Dialog).openDialog = (
      opts: { mode: RunModification.Mode, runData?: RunData, prevID?: string },
    ): void => this.open(opts);

    // Small hack to make the NodeCG dialog look a little better for us, not perfect yet.
    const elem = this.dialog.getElementsByTagName('paper-dialog-scrollable')[0] as HTMLElement;
    elem.style.marginBottom = '12px';
  }
}
</script>

<style>
  /* DOES THIS STYLE NEED TO BE UNSCOPED? */

  .list-move {
    transition: transform 0.2s;
  }
  .list-enter, .list-leave-to
  /* .logo-list-complete-leave-active below version 2.1.8 */ {
    opacity: 0;
    transition: transform 0.2s;
    transition: opacity 0.2s;
  }
  .list-leave-active {
    position: absolute;
  }
</style>

<style scoped>
  h1 {
    margin-bottom: 10px;
  }
</style>
