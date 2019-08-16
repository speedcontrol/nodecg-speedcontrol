<template>
  <div id="App">
    <button @click="openAddDialog">
      Add New Run
    </button>
    <button
      :disabled="removeAllDisabled"
      @click="removeAllRunsConfirm"
    >
      Remove All Runs
    </button>
  </div>
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
      runInfoDialog.querySelector('iframe').contentWindow.open();
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
  button {
    width: 100%;
  }
</style>
