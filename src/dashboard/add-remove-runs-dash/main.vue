<template>
  <v-app>
    <v-btn
      color="#A5D6A7"
      @click="openAddDialog"
    >
      <v-icon>mdi-plus-box</v-icon>Add New Run
    </v-btn>
    <v-btn
      :disabled="removeAllDisabled"
      color="#EF5350"
      @click="removeAllRunsConfirm"
    >
      <v-icon>mdi-delete</v-icon>Remove All Runs
    </v-btn>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import { nodecg } from '../_misc/nodecg';
import { store } from '../_misc/replicant-store';

export default Vue.extend({
  computed: {
    removeAllDisabled() {
      return ['running', 'paused'].includes(store.state.timer.state);
    },
  },
  methods: {
    openAddDialog() {
      const runInfoDialog = nodecg.getDialog('run-modification-dialog') as any;
      runInfoDialog.querySelector('iframe').contentWindow.open({ mode: 'New' });
    },
    removeAllRunsConfirm() {
      const alertDialog = nodecg.getDialog('alert-dialog') as any;
      alertDialog.querySelector('iframe').contentWindow.open({
        name: 'RemoveAllRunsConfirm',
        func: this.removeAllRuns,
      });
    },
    removeAllRuns(confirm: boolean) {
      if (confirm) {
        nodecg.sendMessage('removeAllRuns').then(() => {
          // successful
        }).catch(() => {
          // unsuccessful
        });
      }
    },
  },
});
</script>

<style scoped>
  .v-btn:not(:first-of-type) {
    margin-top: 10px;
  }

  .v-icon {
    padding-right: 5px;
  }
</style>
