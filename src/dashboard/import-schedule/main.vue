<template>
  <div id="App">
    <!-- URL Field -->
    <input
      id="URL"
      v-model="url"
      :disabled="importStatus.importing"
    >
    <br>
    <!-- "Load Schedule Data" Button -->
    <button
      :disabled="importStatus.importing"
      @click="loadSchedule"
    >
      Load Schedule Data
    </button>
    <br>
    <!-- Message before schedule data is loaded -->
    <div v-if="!loaded && !importStatus.importing">
      <br>Insert the Horaro schedule URL above and press
      the "Load Schedule Data" button to continue.
    </div>
    <!-- Dropdowns after data is imported to toggle settings -->
    <div v-if="loaded && !importStatus.importing">
      <br>
      Select the correct columns that match the data type below:
      <!--, if the one auto-selected is wrong:-->
      <dropdown
        v-for="option in runDataOptions"
        :key="option.key"
        :obj-key="option.key"
        :name="option.name"
        :custom="option.custom"
        :columns="columns"
      ></dropdown>
      <br><br>
      Split Players:
      <a
        href="#"
        title="This option dictates how the players in your relevant schedule column are split;
check the README for more information."
      >
        ?
      </a>
      <select v-model="splitOption">
        <option :value="0">
          vs/vs. [Teams]
        </option>
        <option :value="1">
          Comma (,) [No Teams]
        </option>
      </select>
    </div>
    <!-- Message while importing is in progress -->
    <div v-else-if="importStatus.importing">
      <br>Import currently in progress...
    </div>
    <br>
    <!-- Import Button, if importing -->
    <button
      v-if="importStatus.importing"
      :disabled="true"
    >
      Importing {{ importStatus.item }}/{{ importStatus.total }}
    </button>
    <!-- Import Button, not not importing -->
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
import { store as repStore } from '../_misc/replicant-store';
import store from './store';
import Dropdown from './components/Dropdown.vue';

export default Vue.extend({
  components: {
    Dropdown,
  },
  data() {
    return {
      dashUUID: uuid(), // Temp ID for this page load.
      url: nodecg.bundleConfig.schedule.defaultURL,
      loaded: false,
      columns: [],
      runDataOptions: [
        { name: 'Game', key: 'game' },
        { name: 'Game (Twitch)', key: 'gameTwitch' },
        { name: 'Category', key: 'category' },
        { name: 'System', key: 'system' },
        { name: 'Region', key: 'region' },
        { name: 'Released', key: 'release' },
        { name: 'Player(s)', key: 'player' },
      ],
    };
  },
  computed: {
    importStatus() {
      return repStore.state.horaroImportStatus;
    },
    splitOption: {
      get() {
        return store.state.opts.split;
      },
      set(value: number) {
        store.commit('updateSplit', {
          value,
        });
      },
    },
  },
  created() {
    // Add dropdowns for custom data on page load.
    const customData: {
      name: string;
      key: string;
    }[] = nodecg.bundleConfig.schedule.customData || [];
    this.runDataOptions = this.runDataOptions.concat(
      customData.map((col) => {
        store.commit('addCustomColumn', { name: col.key });
        return { name: col.name, key: col.key, custom: true };
      }),
    );
  },
  methods: {
    loadSchedule() {
      nodecg.sendMessage('loadSchedule', {
        url: this.url,
        dashUUID: this.dashUUID,
      }).then((data) => {
        this.loaded = true;
        this.columns = data.schedule.columns;
      }).catch(() => {
        this.loaded = false;
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
          opts: store.state.opts,
          dashUUID: this.dashUUID,
        }).then(() => {
          this.loaded = false;
        }).catch(() => {
          this.loaded = false;
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

  select {
    width: 100%;
  }
</style>
