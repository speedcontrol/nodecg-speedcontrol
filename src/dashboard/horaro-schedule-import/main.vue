<template>
  <v-app>
    <!-- URL Field -->
    <v-text-field
      id="URL"
      v-model="url"
      filled
      hide-details
      label="Horaro Schedule URL"
      :disabled="importStatus.importing"
    ></v-text-field>
    <!-- "Load Schedule Data" Button -->
    <v-btn
      :disabled="importStatus.importing"
      @click="loadSchedule"
    >
      Load Schedule Data
    </v-btn>
    <!-- Message before schedule data is loaded -->
    <div v-if="!loaded && !importStatus.importing">
      Insert the Horaro schedule URL above and press
      the "Load Schedule Data" button to continue.
    </div>
    <!-- Dropdowns after data is imported to toggle settings -->
    <div v-if="loaded && !importStatus.importing">
      Select the correct columns that match the data type below,
      if the one auto-selected is wrong:
      <dropdown
        v-for="option in runDataOptions"
        :key="option.key"
        :option="option"
        :columns="columns"
        class="Dropdown"
      ></dropdown>
      <br>Split Players:
      <a
        href="#"
        title="This option dictates how the players in your relevant schedule column are split;
check the README for more information."
      >?</a>
      <v-select
        v-model="splitOption"
        :items="splitOptionsOpts"
        label="Player Split"
        filled
        single-line
        hide-details
        dense
        :height="27"
        class="Dropdown"
      >
      </v-select>
    </div>
    <!-- Message while importing is in progress -->
    <div v-else-if="importStatus.importing">
      Import currently in progress...
    </div>
    <!-- Import Button, if importing -->
    <v-btn
      v-if="importStatus.importing"
      :disabled="true"
    >
      Importing {{ importStatus.item }}/{{ importStatus.total }}
    </v-btn>
    <!-- Import Button, if not importing -->
    <v-btn
      v-else
      :disabled="!loaded"
      @click="importConfirm"
    >
      Import
    </v-btn>
  </v-app>
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
      columns: [] as string[],
      runDataOptions: [
        {
          name: 'Game',
          key: 'game',
          predict: [
            'game',
          ],
        },
        {
          name: 'Game (Twitch)',
          key: 'gameTwitch',
          predict: [
            // none yet
          ],
        },
        {
          name: 'Category',
          key: 'category',
          predict: [
            'category',
          ],
        },
        {
          name: 'System',
          key: 'system',
          predict: [
            'system',
            'platform',
            'column',
          ],
        },
        {
          name: 'Region',
          key: 'region',
          predict: [
            'region',
          ],
        },
        {
          name: 'Released',
          key: 'release',
          predict: [
            'release',
          ],
        },
        {
          name: 'Player(s)',
          key: 'player',
          predict: [
            'player',
            'runner',
          ],
        },
      ] as {
        name: string;
        key: string;
        predict: string[];
        custom?: boolean;
      }[],
      splitOptionsOpts: [
        {
          value: 0,
          text: 'vs/vs. [Teams]',
        },
        {
          value: 1,
          text: 'Comma (,) [No Teams]',
        },
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
    this.addCustomDataDropdowns();
  },
  methods: {
    loadSchedule() {
      nodecg.sendMessage('loadSchedule', {
        url: this.url,
        dashUUID: this.dashUUID,
      }).then((data) => {
        this.loaded = true;
        this.columns = data.schedule.columns;
        this.predictColumns();
      }).catch(() => {
        this.loaded = false;
      });
    },
    addCustomDataDropdowns() {
      const customData: {
        name: string;
        key: string;
      }[] = nodecg.bundleConfig.schedule.customData || [];
      this.runDataOptions = this.runDataOptions.concat(
        customData.map((col) => {
          store.commit('addCustomColumn', { name: col.key });
          return {
            name: col.name,
            key: col.key,
            custom: true,
            predict: [
              col.name.toLowerCase(),
            ],
          };
        }),
      );
    },
    predictColumns() {
      this.runDataOptions.forEach((option) => {
        if (!option.predict.length) {
          return; // Ignore if no way to predict.
        }
        const index = this.columns.findIndex(
          col => option.predict.some(pred => !!col.toLowerCase().includes(pred)),
        );
        if (index >= 0) {
          store.commit('updateColumn', {
            name: option.key,
            value: index,
            custom: option.custom,
          });
        }
      });
    },
    importConfirm() {
      const alertDialog = nodecg.getDialog('alert-dialog') as any;
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
  .v-btn {
    width: 100%;
  }
  .v-btn:first-of-type {
    margin: 5px 0 10px 0;
  }
  .v-btn:last-of-type {
    margin-top: 10px;
  }

  .v-select {
    margin-top: 5px;
  }
</style>

<style>
  .Dropdown .v-input__slot {
    min-height: 0 !important;
  }

  .Dropdown .v-label {
    top: 4px !important;
  }

  .Dropdown .v-input__append-inner {
    margin-top: 2px !important;
  }
</style>
