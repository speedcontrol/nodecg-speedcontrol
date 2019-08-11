<template>
  <div id="App">
    <button
      :disabled="importStatus.importing"
      @click="loadSchedule"
    >
      Load Schedule
    </button>
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
import uuid from 'uuid/v4';
import { nodecg } from '../_misc/nodecg';
import { store } from '../_misc/replicant-store';

export default Vue.extend({
  data() {
    return {
      dashUUID: uuid(), // Temp ID for this page load.
    };
  },
  computed: {
    importStatus() {
      return store.state.horaroImportStatus;
    },
  },
  methods: {
    loadSchedule() {
      nodecg.sendMessage('loadSchedule', {
        url: nodecg.bundleConfig.schedule.defaultURL,
        dashUUID: this.dashUUID,
      }).then((data) => {
        console.log(data);
      }).catch((err) => {
        // catch error
      });
    },
    importScheduleConfirm() {
      const alertDialog = nodecg.getDialog('alert') as any;
      alertDialog.querySelector('iframe').contentWindow.open({
        name: 'HoraroImportConfirm',
        func: this.importSchedule,
      });
    },
    importSchedule(confirm: boolean) {
      if (confirm) {
        nodecg.sendMessage('importSchedule', {
          opts: {
            columns: {
              game: 0,
              gameTwitch: -1,
              category: 3,
              system: 2,
              region: -1,
              release: -1,
              player: 1,
              custom: {
                layout: 5,
              },
            },
            split: 0,
          },
          dashUUID: this.dashUUID,
        });
      }
    },
  },
});
</script>
