<template>
  <div id="App">
    <h1 v-if="newRun">
      Add Run
    </h1>
    <h1 v-else>
      Edit Run
    </h1>
    <div>
      <!-- Normal Inputs -->
      <input
        v-for="input in inputs"
        :key="input.key"
        v-model="runData[input.key]"
        :placeholder="input.name"
        :title="input.name"
      >
      <!-- Custom Data Inputs -->
      <input
        v-for="data in customData"
        :key="data.key"
        v-model="runData.customData[data.key]"
        :placeholder="data.name"
      >
    </div>
    <div>
      <!-- Teams -->
      <draggable
        v-model="runData.teams"
      >
        <transition-group name="list">
          <team
            v-for="team in runData.teams"
            :key="team.id"
            :team-data="team"
          ></team>
        </transition-group>
      </draggable>
    </div>
    <br><button @click="addNewTeam">
      Add New Team
    </button>
    <br><div class="DialogButtons">
      <button
        @click="close(true)"
      >
        OK
      </button>
      <button
        @click="close(false)"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import store from './store';
import Team from './components/Team.vue';
import { nodecg } from '../_misc/nodecg';
import { RunData } from '../../../types';

const draggable = require('vuedraggable'); // Don't need types now :)

export default Vue.extend({
  components: {
    Team,
    draggable,
  },
  data() {
    return {
      dialog: undefined as any,
      newRun: true,
      inputs: [
        { key: 'game', name: 'Game' },
        { key: 'gameTwitch', name: 'Game (Twitch)' },
        { key: 'category', name: 'Category' },
        { key: 'estimate', name: 'Estimate (HH:MM:SS)' },
        { key: 'system', name: 'System' },
        { key: 'region', name: 'Region' },
        { key: 'release', name: 'Released' },
        { key: 'setupTime', name: 'Setup Time (HH:MM:SS)' },
      ],
    };
  },
  computed: {
    runData: {
      get() {
        return store.state.runData;
      },
      set(value: RunData) {
        store.commit('updateRunData', { value });
      },
    },
    customData() {
      return nodecg.bundleConfig.schedule.customData || [];
    },
  },
  mounted() {
    this.dialog = nodecg.getDialog('run-modification-dialog') as any;

    // Attaching this function to the window for easy access from dashboard panels.
    (window as any).open = (runData?: RunData) => this.open(runData);

    // Small hack to make the NodeCG dialog look a little better for us, not perfect yet.
    const elem = this.dialog.getElementsByTagName('paper-dialog-scrollable')[0] as HTMLElement;
    elem.style.marginBottom = '12px';
  },
  methods: {
    open(value?: RunData) {
      // Waits for dialog to actually open before changing storage.
      this.dialog.open();
      document.addEventListener('dialog-opened', () => {
        if (value) {
          store.commit('updateRunData', { value });
          this.newRun = false;
        } else {
          store.commit('resetRunData');
          store.commit('addNewTeam');
          this.newRun = true;
        }
      }, { once: true });
      document.addEventListener('dialog-confirmed', this.confirm, { once: true });
      document.addEventListener('dialog-dismissed', this.dismiss, { once: true });
    },
    close(confirm: boolean) {
      this.dialog._updateClosingReasonConfirmed(confirm); // eslint-disable-line
      this.dialog.close();
    },
    confirm() {
      store.dispatch('saveRunData');
      document.removeEventListener('dialog-dismissed', this.dismiss);
    },
    dismiss() {
      document.removeEventListener('dialog-confirmed', this.confirm);
    },
    addNewTeam() {
      store.commit('addNewTeam');
    },
  },
});
</script>

<style scoped>
  input {
    width: 100%;
  }

  .DialogButtons {
    float: right;
  }

  .list-move {
    transition: transform 0.2s;
  }
  .list-enter, .list-leave-to
  /* .logo-list-complete-leave-active below version 2.1.8 */ {
    opacity: 0;
    transition: transform 0.2s;
    transition: opacity 0.2s;
  }
  .list-leave-active {
    position: absolute;
  }
</style>
