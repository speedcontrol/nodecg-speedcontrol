<template>
  <div id="App">
    <button
      :disabled="importStatus.importing"
      @click="importScheduleConfirm"
    >
      Import Schedule
    </button>
    <div v-if="importStatus.importing">
      <br>
      Importing {{ importStatus.item }}/{{ importStatus.total }}
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { nodecg } from '../_misc/nodecg';
import { store } from '../_misc/replicant-store';

export default Vue.extend({
  computed: {
    importStatus() {
      return store.state.horaroImportStatus;
    },
  },
  methods: {
    importScheduleConfirm() {
      const alertDialog = nodecg.getDialog('alert') as any;
      alertDialog.querySelector('iframe').contentWindow.open({
        name: 'HoraroImportConfirm',
        func: this.importSchedule,
      });
    },
    importSchedule(confirm: boolean) {
      if (confirm) {
        nodecg.sendMessage('importSchedule');
      }
    },
  },
});
</script>
