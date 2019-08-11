<template>
  <div id="App">
    <input
      id="URL"
      v-model="url"
      :disabled="importStatus.importing"
    >
    <br>
    <button
      :disabled="importStatus.importing"
      @click="loadSchedule"
    >
      Load Schedule Data
    </button>
    <br>
    <div
      v-if="loaded"
    >
      <br>Schedule data loaded, click "Import" below (settings to go here later).
    </div>
    <div
      v-else-if="importStatus.importing"
    >
      <br>Import currently in progress...
    </div>
    <div
      v-else
    >
      <br>Insert the Horaro schedule URL above and press
      the "Load Schedule Data" button to continue.
    </div>
    <br>
    <button
      v-if="importStatus.importing"
      :disabled="true"
    >
      Importing {{ importStatus.item }}/{{ importStatus.total }}
    </button>
    <button
      v-else
      :disabled="!loaded"
      @click="importConfirm"
    >
      Import
    </button>
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
      url: nodecg.bundleConfig.schedule.defaultURL,
      loaded: false,
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
        url: this.url,
        dashUUID: this.dashUUID,
      }).then((data) => {
        this.loaded = true;
        console.log(data);
      }).catch((err) => {
        // catch error
      });
    },
    importConfirm() {
      const alertDialog = nodecg.getDialog('alert') as any;
      alertDialog.querySelector('iframe').contentWindow.open({
        name: 'HoraroImportConfirm',
        func: this.import,
      });
    },
    import(confirm: boolean) {
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
        }).then(() => {
          this.loaded = false;
        }).catch((err) => {
          // catch error
        });
      }
    },
  },
});
</script>

<style scoped>
  #URL {
    box-sizing: border-box;
    width: 100%;
  }

  button {
    width: 100%;
  }
</style>
