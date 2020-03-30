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
import Vue from 'vue';
import { nodecg } from '../../nodecg';
import { store } from '../../replicant-store';
import { Configschema } from '../../../../../configschema';
import ModifyButton from './ModifyButton.vue';
import { Timer, RunDataActiveRun } from '../../../../../types';

export default Vue.extend({
  name: 'RunPanel',
  components: {
    ModifyButton,
  },
  props: {
    runData: {
      type: Object,
      default(): object {
        return {};
      },
    },
    editor: {
      type: Boolean,
      default: false,
    },
    disableChange: {
      type: Boolean,
      default: false,
    },
    moveDisabled: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    playerStr(): string {
      return this.runData.teams.map((team) => (
        `${team.name ? `${team.name}:` : ''}
        ${team.players.map((player) => player.name).join(', ')}`
      )).join(' vs. ');
    },
    activeRun(): RunDataActiveRun {
      return store.state.runDataActiveRun;
    },
    runFinishTime(): Timer {
      return store.state.runFinishTimes[this.runData.id];
    },
  },
  methods: {
    customDataName(key): string {
      return (nodecg.bundleConfig as Configschema).schedule.customData.find(
        (custom) => custom.key === key,
      ).name;
    },
    playRun(): void {
      nodecg.sendMessage('changeActiveRun', this.runData.id).then((noTwitchGame) => {
        if (noTwitchGame) {
          const alertDialog = nodecg.getDialog('alert-dialog') as any; // eslint-disable-line @typescript-eslint/no-explicit-any, max-len
          alertDialog.querySelector('iframe').contentWindow.open({
            name: 'NoTwitchGame',
          });
        }
      }).catch(() => {
        // run change unsuccessful
      });
    },
    duplicateRun(): void {
      const runInfoDialog = nodecg.getDialog('run-modification-dialog') as any; // eslint-disable-line @typescript-eslint/no-explicit-any, max-len
      runInfoDialog.querySelector('iframe').contentWindow.open({
        mode: 'Duplicate',
        runData: this.runData,
      });
    },
    addNewRunAfter(): void {
      const runInfoDialog = nodecg.getDialog('run-modification-dialog') as any; // eslint-disable-line @typescript-eslint/no-explicit-any, max-len
      runInfoDialog.querySelector('iframe').contentWindow.open({
        mode: 'New',
        prevID: this.runData.id,
      });
    },
    editRun(): void {
      const runInfoDialog = nodecg.getDialog('run-modification-dialog') as any; // eslint-disable-line @typescript-eslint/no-explicit-any, max-len
      runInfoDialog.querySelector('iframe').contentWindow.open({
        mode: 'EditOther',
        runData: this.runData,
      });
    },
    removeRunConfirm(): void {
      const alertDialog = nodecg.getDialog('alert-dialog') as any; // eslint-disable-line @typescript-eslint/no-explicit-any, max-len
      alertDialog.querySelector('iframe').contentWindow.open({
        name: 'RemoveRunConfirm',
        data: { runData: this.runData },
        func: this.removeRun,
      });
    },
    removeRun(confirm: boolean): void {
      if (confirm) {
        nodecg.sendMessage('removeRun', this.runData.id).then(() => {
          // run change successful
        }).catch(() => {
          // run change unsuccessful
        });
      }
    },
  },
});
</script>
