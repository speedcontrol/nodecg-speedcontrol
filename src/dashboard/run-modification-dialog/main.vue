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
          :value="runData.game"
          @input="updateRunDataProp('game', $event)"
          :label="$t('game')"
        />
        <text-input
          :value="runData.category"
          @input="updateRunDataProp('category', $event)"
          :label="$t('category')"
          left-border
        />
      </div>
      <div class="d-flex">
        <text-input
          :value="runData.region"
          @input="updateRunDataProp('region', $event)"
          :label="$t('region')"
        />
        <text-input
          :value="runData.release"
          @input="updateRunDataProp('release', $event)"
          :label="$t('released')"
          left-border
        />
        <text-input
          :value="runData.gameTwitch"
          @input="updateRunDataProp('gameTwitch', $event)"
          :label="$t('gameTwitch')"
          left-border
        />
      </div>
      <div class="d-flex">
        <text-input
          :value="runData.system"
          @input="updateRunDataProp('system', $event)"
          :label="$t('system')"
        />
        <text-input
          :value="runData.estimate"
          @input="updateRunDataProp('estimate', $event)"
          :label="$t('estimate')"
          left-border
        />
        <text-input
          :value="runData.setupTime"
          @input="updateRunDataProp('setupTime', $event)"
          :label="$t('setupTime')"
          left-border
        />
      </div>
      <!-- Custom Data Inputs -->
      <div class="d-flex">
        <text-input
          v-for="(data, i) in customData"
          :key="data.key"
          :value="runData.customData[data.key]"
          @input="updateRunDataProp(`customData.${data.key}`, $event)"
          :label="data.name"
          :left-border="i > 0"
        />
      </div>
      <v-checkbox
        class="ma-3 pa-0"
        hide-details
        :label="$t('relay')"
        :value="runData.relay"
        @change="updateRunDataProp('relay', $event || undefined)"
      />
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
import { NodeCGAPIClient } from '@nodecg/types/client/api/api.client';
import { Alert, RunData, RunModification } from '@nodecg-speedcontrol/types';
import { Configschema, TwitchAPIData } from '@nodecg-speedcontrol/types/schemas';
import clone from 'clone';
import { DeepWritable } from 'ts-essentials';
import { Component, Vue } from 'vue-property-decorator';
import Draggable from 'vuedraggable';
import { getDialog } from '../_misc/helpers';
import { replicantNS } from '../_misc/replicant_store';
import ModifyButton from './components/ModifyButton.vue';
import Team from './components/Team.vue';
import TextInput from './components/TextInput.vue';
import { storeModule } from './store';

@Component({
  components: {
    Draggable,
    TextInput,
    Team,
    ModifyButton,
  },
})
export default class extends Vue {
  @replicantNS.State((s) => s.reps.twitchAPIData) readonly twitchAPIData!: TwitchAPIData;
  dialog: ReturnType<NodeCGAPIClient['getDialog']>;
  err: Error | null = null;

  get mode(): RunModification.Mode { return storeModule.mode; }
  set mode(val: RunModification.Mode) { storeModule.updateMode(val); }

  get updateTwitch(): boolean { return storeModule.updateTwitchBool; }
  set updateTwitch(val: boolean) { storeModule.updateTwitch(val); }

  get runData(): RunData { return storeModule.runData; }
  set runData(val: RunData) { storeModule.updateRunData(val); }

  addNewTeam(): void { storeModule.addNewTeam(); }

  get customData(): { name: string, key: string, ignoreMarkdown?: boolean }[] {
    const cfg = nodecg.bundleConfig as DeepWritable<Configschema>; // Doing this for simplicity
    const customData = clone(cfg.schedule?.customData || cfg.customData?.run || []);
    Object.keys(this.runData.customData).forEach((key) => {
      if (!customData.find(({ key: k }) => k === key)) {
        customData.push({ name: `(?) ${key}`, key });
      }
    });
    return customData;
  }

  open(opts: { mode: RunModification.Mode, runData?: RunData, prevID?: string }): void {
    // Waits for dialog to actually open before changing storage.
    this.dialog?.open();
    document.addEventListener('dialog-opened', () => {
      this.mode = opts.mode;
      this.err = null;
      if (opts.runData) {
        storeModule.updateRunData(opts.runData);
        if (opts.mode === 'Duplicate') {
          storeModule.setAsDuplicate();
        }
      } else if (opts.mode === 'New') {
        storeModule.setPreviousRunID(opts.prevID);
        storeModule.resetRunData();
        storeModule.addNewTeam();
      }
    }, { once: true });
    document.addEventListener('dialog-confirmed', this.confirm, { once: true });
    document.addEventListener('dialog-dismissed', this.dismiss, { once: true });
  }

  updateRunDataProp(key: string, val: string | boolean): void {
    if (key.startsWith('customData.')) {
      const newVal = { ...this.runData.customData, [key.replace('customData.', '')]: val };
      storeModule.updateRunDataProp({ key: 'customData', val: newVal });
    } else {
      storeModule.updateRunDataProp({ key, val });
    }
  }

  async attemptSave(): Promise<void> {
    this.err = null;
    try {
      const noTwitchGame = await storeModule.saveRunData();
      this.close(true);
      if (noTwitchGame) {
        const dialog = getDialog('alert-dialog') as Alert.Dialog;
        if (dialog) {
          dialog.openDialog({ name: 'NoTwitchGame' });
        }
      }
    } catch (err) {
      this.err = err;
    }
  }

  close(confirm: boolean): void {
    (this.dialog as any)._updateClosingReasonConfirmed(confirm); // eslint-disable-line no-underscore-dangle
    this.dialog?.close();
  }

  confirm(): void {
    document.removeEventListener('dialog-dismissed', this.dismiss);
  }

  dismiss(): void {
    document.removeEventListener('dialog-confirmed', this.confirm);
  }

  mounted(): void {
    this.dialog = nodecg.getDialog('run-modification-dialog');

    // Attaching this function to the window for easy access from dashboard panels.
    (window as Window as RunModification.Dialog).openDialog = (
      opts: { mode: RunModification.Mode, runData?: RunData, prevID?: string },
    ): void => this.open(opts);

    // Small hack to make the NodeCG dialog look a little better for us, not perfect yet.
    const elem = this.dialog?.getElementsByTagName('paper-dialog-scrollable')[0] as HTMLElement;
    elem.style.marginBottom = '12px';
  }
}
</script>

<style scoped>
  h1 {
    margin-bottom: 10px;
  }

  .list-move {
    transition: transform 0.2s;
  }
  .list-enter, .list-leave-to {
    opacity: 0;
    transition: transform 0.2s, opacity 0.2s;
  }
  .list-leave-active {
    position: absolute;
  }
</style>
