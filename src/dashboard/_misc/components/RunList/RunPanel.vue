<i18n>
{
  "en": {
    "playRun": "Play Run",
    "newRunAfter": "Add New Run After",
    "removeRun": "Remove Run"
  },
  "ja": {
    "playRun": "走者情報の実行",
    "newRunAfter": "後ろに走者情報を追加",
    "removeRun": "走者情報の削除"
  }
}
</i18n>

<template>
  <v-expansion-panel
    :class="{ 'grey darken-2': !editor && activeRun && activeRun.id === runData.id }"
  >
    <v-expansion-panel-header>
      <span>
        <v-icon
          v-if="!moveDisabled"
          class="Handle"
          :style="{ cursor: 'move' }"
        >
          mdi-drag-vertical
        </v-icon>
        {{ runData.game }}
      </span>
    </v-expansion-panel-header>
    <v-expansion-panel-content class="body-2">
      <div v-if="playerStr">
        <span class="font-weight-bold">{{ $t('players') }}:</span>
        <span>{{ playerStr }}</span>
      </div>
      <div v-if="runData.category">
        <span class="font-weight-bold">{{ $t('category') }}:</span>
        <span>{{ runData.category }}</span>
      </div>
      <div v-if="runData.estimate">
        <span class="font-weight-bold">{{ $t('estimate') }}:</span>
        <span>{{ runData.estimate }}</span>
      </div>
      <div v-if="runData.system">
        <span class="font-weight-bold">{{ $t('system') }}:</span>
        <span>{{ runData.system }}</span>
      </div>
      <div v-if="runData.region">
        <span class="font-weight-bold">{{ $t('region') }}:</span>
        <span>{{ runData.region }}</span>
      </div>
      <div v-if="runData.release">
        <span class="font-weight-bold">{{ $t('released') }}:</span>
        <span>{{ runData.release }}</span>
      </div>
      <div v-if="runFinishTime">
        <span class="font-weight-bold">{{ $t('finalTime') }}:</span>
        <span>{{ runFinishTime.time }}</span>
      </div>
      <div
        v-for="(val, key) in runData.customData"
        :key="key"
      >
        <span class="font-weight-bold">{{ customDataName(key) }}:</span>
        <span>{{ val }}</span>
      </div>
      <div style="margin-top: 10px">
        <!-- Buttons for "Run Player" dashboard panel. -->
        <div v-if="!editor">
          <modify-button
            icon="mdi-play"
            :tooltip="$t('playRun')"
            :disabled="disableChange"
            @click="playRun"
          />
        </div>
        <!-- Buttons for "Run Editor" dashboard panel. -->
        <div v-else>
          <modify-button
            icon="mdi-content-duplicate"
            :tooltip="$t('duplicateRun')"
            @click="duplicateRun"
          />
          <modify-button
            icon="mdi-file-plus-outline"
            :tooltip="$t('newRunAfter')"
            @click="addNewRunAfter"
          />
          <modify-button
            icon="mdi-square-edit-outline"
            :tooltip="$t('editRun')"
            @click="editRun"
          />
          <modify-button
            icon="mdi-file-remove-outline"
            :tooltip="$t('removeRun')"
            @click="removeRunConfirm"
          />
        </div>
      </div>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { RunFinishTimes, Timer, Configschema } from '@nodecg-speedcontrol/types/schemas';
import { RunData, RunModification, Alert, RunDataActiveRun } from '@nodecg-speedcontrol/types';
import ModifyButton from './ModifyButton.vue';
import { getDialog } from '../../helpers';
import { replicantNS } from '../../replicant_store';

@Component({
  components: {
    ModifyButton,
  },
})
export default class extends Vue {
  @Prop({ type: Object, required: true }) readonly runData!: RunData;
  @Prop(Boolean) readonly editor!: boolean;
  @Prop(Boolean) readonly disableChange!: boolean;
  @Prop(Boolean) readonly moveDisabled!: boolean;
  @replicantNS.State((s) => s.reps.runDataActiveRun) readonly activeRun!: RunDataActiveRun;
  @replicantNS.State((s) => s.reps.runFinishTimes) readonly runFinishTimes!: RunFinishTimes;

  get playerStr(): string {
    return this.runData.teams.map((team) => (
      `${team.name ? `${team.name}:` : ''}
      ${team.players.map((player) => player.name).join(', ')}`
    )).join(' vs. ');
  }

  get runFinishTime(): Timer | undefined {
    return this.runFinishTimes[this.runData.id];
  }

  customDataName(key: string): string {
    const customData = (nodecg.bundleConfig as Configschema).schedule.customData || [];
    return customData.find(
      (custom) => custom.key === key,
    )?.name || `? (${key})`;
  }

  async playRun(): Promise<void> {
    try {
      const noTwitchGame = await nodecg.sendMessage('changeActiveRun', this.runData.id); // TYPE!
      if (noTwitchGame) {
        const dialog = getDialog('alert-dialog') as Alert.Dialog;
        if (dialog) {
          dialog.openDialog({ name: 'NoTwitchGame' });
        }
      }
    } catch (err) {
      // catch
    }
  }

  duplicateRun(): void {
    const dialog = getDialog('run-modification-dialog') as RunModification.Dialog;
    if (dialog) {
      dialog.openDialog({
        mode: 'Duplicate',
        runData: this.runData,
      });
    }
  }

  addNewRunAfter(): void {
    const dialog = getDialog('run-modification-dialog') as RunModification.Dialog;
    if (dialog) {
      dialog.openDialog({
        mode: 'New',
        prevID: this.runData.id,
      });
    }
  }

  editRun(): void {
    const dialog = getDialog('run-modification-dialog') as RunModification.Dialog;
    if (dialog) {
      dialog.openDialog({
        mode: 'EditOther',
        runData: this.runData,
      });
    }
  }

  removeRunConfirm(): void {
    const dialog = getDialog('alert-dialog') as Alert.Dialog;
    if (dialog) {
      dialog.openDialog({
        name: 'RemoveRunConfirm',
        data: { runData: this.runData },
        func: this.removeRun,
      });
    }
  }

  async removeRun(confirm: boolean): Promise<void> {
    if (confirm) {
      try {
        await nodecg.sendMessage('removeRun', this.runData.id);
      } catch (err) {
        // catch
      }
    }
  }
}
</script>
