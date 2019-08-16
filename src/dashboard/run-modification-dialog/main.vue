<template>
  <div id="App">
    <h1 v-if="newRun">
      Add Run
    </h1>
    <h1 v-else>
      Edit Run
    </h1>
    <div class="GeneralInputs">
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
    <br><br><div v-if="activeBtn">
      <input
        v-model="runListUpdate"
        type="checkbox"
      > Also update run in run list.
    </div>
    <div v-else-if="active">
      <input
        v-model="activeRunUpdate"
        type="checkbox"
      > Also update active run.
    </div>
    <br><div class="DialogButtons">
      <button @click="close(true)">
        OK
      </button>
      <button @click="close(false)">
        Cancel
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import store from './store';
import { store as repStore } from '../_misc/replicant-store';
import Team from './components/Team.vue';
import { nodecg } from '../_misc/nodecg';
import { RunData } from '../../../types';

const Draggable = require('vuedraggable'); // Don't need types now :)

export default Vue.extend({
  components: {
    Team,
    Draggable,
  },
  data() {
    return {
      dialog: undefined as any,
      newRun: true,
      activeBtn: false,
      active: false,
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
    runListUpdate: {
      get() {
        return store.state.runListUpdate;
      },
      set(value: boolean) {
        store.commit('toggleRunListUpdateBool', { value });
      },
    },
    activeRunUpdate: {
      get() {
        return store.state.activeRunUpdate;
      },
      set(value: boolean) {
        store.commit('toggleActiveRunUpdateBool', { value });
      },
    },
    customData() {
      return nodecg.bundleConfig.schedule.customData || [];
    },
  },
  mounted() {
    this.dialog = nodecg.getDialog('run-modification-dialog') as any;

    // Attaching this function to the window for easy access from dashboard panels.
    (window as any).open = (opts?: {
      runData?: RunData;
      active?: boolean;
    }) => this.open(opts);

    // Small hack to make the NodeCG dialog look a little better for us, not perfect yet.
    const elem = this.dialog.getElementsByTagName('paper-dialog-scrollable')[0] as HTMLElement;
    elem.style.marginBottom = '12px';
  },
  methods: {
    open(opts?: {
      runData?: RunData;
      activeBtn?: boolean;
    }) {
      // Waits for dialog to actually open before changing storage.
      this.dialog.open();
      document.addEventListener('dialog-opened', () => {
        if (opts && opts.runData) {
          store.commit('updateRunData', { value: opts.runData });
          this.newRun = false;
        } else {
          store.commit('resetRunData');
          store.commit('addNewTeam');
          this.newRun = true;
        }
        this.activeBtn = !!opts && !!opts.activeBtn;
        this.active = (
          !!opts
          && !!opts.runData
          && !!repStore.state.runDataActiveRun
          && opts.runData.id === repStore.state.runDataActiveRun.id
        );
        if (this.activeBtn) {
          this.activeRunUpdate = true;
        } else {
          this.runListUpdate = true;
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
  .GeneralInputs > input {
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
