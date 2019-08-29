<template>
  <v-expansion-panel
    :class="{'grey darken-2': !editor && activeRun && activeRun.id === runData.id}"
  >
    <v-expansion-panel-header>
      <span>
        <v-icon
          v-if="!moveDisabled"
          class="Handle"
        >
          mdi-drag-vertical
        </v-icon>
        {{ runData.game }}
      </span>
    </v-expansion-panel-header>
    <v-expansion-panel-content class="body-2">
      <div v-if="playerStr">
        <span class="Bold">Players:</span>
        <span>{{ playerStr }}</span>
      </div>
      <div v-if="runData.category">
        <span class="Bold">Category:</span>
        <span>{{ runData.category }}</span>
      </div>
      <div v-if="runData.estimate">
        <span class="Bold">Estimate:</span>
        <span>{{ runData.estimate }}</span>
      </div>
      <div v-if="runData.system">
        <span class="Bold">System:</span>
        <span>{{ runData.system }}</span>
      </div>
      <div v-if="runData.region">
        <span class="Bold">Region:</span>
        <span>{{ runData.region }}</span>
      </div>
      <div v-if="runData.release">
        <span class="Bold">Released:</span>
        <span>{{ runData.release }}</span>
      </div>
      <div
        v-for="(val, key) in runData.customData"
        :key="key"
      >
        <span class="Bold">{{ customDataName(key) }}:</span>
        <span>{{ val }}</span>
      </div>
      <div style="margin-top: 10px">
        <!-- Buttons for "Run Player" dashboard panel. -->
        <div v-if="!editor">
          <modify-button
            icon="mdi-play"
            tooltip="Play Run"
            :disabled="disableChange"
            @click="playRun"
          ></modify-button>
        </div>
        <!-- Buttons for "Run Editor" dashboard panel. -->
        <div v-else>
          <modify-button
            icon="mdi-content-duplicate"
            tooltip="Duplicate Run"
            @click="duplicateRun"
          ></modify-button>
          <!-- TO BE IMPLEMENTED -->
          <!--<modify-button
            icon="mdi-file-plus-outline"
            tooltip="Add New Run After"
            @click="addNewRunAfter"
          ></modify-button>-->
          <modify-button
            icon="mdi-square-edit-outline"
            tooltip="Edit Run"
            @click="editRun"
          ></modify-button>
          <modify-button
            icon="mdi-file-remove-outline"
            tooltip="Remove Run"
            @click="removeRunConfirm"
          ></modify-button>
        </div>
      </div>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script lang="ts">
import Vue from 'vue';
import { nodecg } from '../../nodecg';
import { store } from '../../replicant-store';
import { Configschema } from '../../../../../../configschema';
import ModifyButton from './ModifyButton.vue';

export default Vue.extend({
  name: 'RunPanel',
  components: {
    ModifyButton,
  },
  props: {
    runData: {
      type: Object,
      default() {
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
    playerStr() {
      return this.runData.teams.map((team): string => (
        `${team.name ? `${team.name}:` : ''}
        ${team.players.map((player): string => player.name).join(', ')}`
      )).join(' vs. ');
    },
    activeRun() {
      return store.state.runDataActiveRun;
    },
  },
  methods: {
    customDataName(key: string) {
      return (nodecg.bundleConfig as Configschema).schedule.customData.find(
        custom => custom.key === key,
      ).name;
    },
    playRun() {
      nodecg.sendMessage('changeActiveRun', this.runData.id).then(() => {
        // run change successful
      }).catch(() => {
        // run change unsuccessful
      });
    },
    duplicateRun() {
      const runInfoDialog = nodecg.getDialog('run-modification-dialog') as any;
      runInfoDialog.querySelector('iframe').contentWindow.open({
        mode: 'Duplicate',
        runData: this.runData,
      });
    },
    editRun() {
      const runInfoDialog = nodecg.getDialog('run-modification-dialog') as any;
      runInfoDialog.querySelector('iframe').contentWindow.open({
        mode: 'EditOther',
        runData: this.runData,
      });
    },
    removeRunConfirm() {
      const alertDialog = nodecg.getDialog('alert-dialog') as any;
      alertDialog.querySelector('iframe').contentWindow.open({
        name: 'RemoveRunConfirm',
        data: { runData: this.runData },
        func: this.removeRun,
      });
    },
    removeRun(confirm: boolean) {
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

<style scoped>
  .Bold {
    font-weight: bold;
  }

  .Handle {
    cursor: move;
  }
</style>
