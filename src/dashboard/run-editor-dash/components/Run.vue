<template>
  <v-expansion-panel>
    <v-expansion-panel-header>{{ runData.game }}</v-expansion-panel-header>
    <v-expansion-panel-content>
      Category: {{ runData.category }}
      <br>Estimate: {{ runData.estimate }}
      <br>System: {{ runData.system }}
      <br><br>
      <modify-button
        icon="mdi-content-duplicate"
        tooltip="Duplicate Run"
        @click="duplicateRun"
      ></modify-button>
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
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script lang="ts">
import Vue from 'vue';
import { nodecg } from '../../_misc/nodecg';
import ModifyButton from './ModifyButton.vue';

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
  methods: {
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
