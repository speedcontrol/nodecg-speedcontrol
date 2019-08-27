<template>
  <v-expansion-panel>
    <v-expansion-panel-header>
      {{ runData.game }}
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
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script lang="ts">
import Vue from 'vue';
import { nodecg } from '../../_misc/nodecg';
import ModifyButton from './ModifyButton.vue';
import { Configschema } from '../../../../configschema';

export default Vue.extend({
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
  },
  computed: {
    playerStr() {
      return this.runData.teams.map((team): string => (
        `${team.name ? `${team.name}:` : ''}
        ${team.players.map((player): string => player.name).join(', ')}`
      )).join(' vs. ');
    },
  },
  methods: {
    customDataName(key: string) {
      return (nodecg.bundleConfig as Configschema).schedule.customData.find(
        custom => custom.key === key,
      ).name;
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
</style>
