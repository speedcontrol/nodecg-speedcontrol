<template>
  <v-app>
    <h1 v-if="mode === 'New'">
      Add Run
    </h1>
    <h1 v-else-if="mode === 'Duplicate'">
      Duplicate Run
    </h1>
    <h1 v-else>
      Edit Run
    </h1>
    <div
      v-if="err"
      class="Error"
    >
      ERROR: {{ err.message }}<br><br>
    </div>
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
    <br><div class="DialogButtons">
      <button @click="attemptSave">
        OK
      </button>
      <button @click="close(false)">
        Cancel
      </button>
    </div>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import store from './store';
import Team from './components/Team.vue';
import { nodecg } from '../_misc/nodecg';
import { RunData } from '../../../types';

const Draggable = require('vuedraggable'); // Don't need types now :)

enum Mode {
  New = 'New',
  EditActive = 'EditActive',
  EditOther = 'EditOther',
  Duplicate = 'Duplicate',
}

export default Vue.extend({
  components: {
    Team,
    Draggable,
  },
  data() {
    return {
      dialog: undefined as any,
      err: undefined as Error | undefined,
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
    mode: {
      get() {
        return store.state.mode;
      },
      set(value: Mode) {
        store.commit('updateMode', { value });
      },
    },
    customData() {
      return nodecg.bundleConfig.schedule.customData || [];
    },
  },
  created() {
    this.$vuetify.theme.dark = true;
  },
  mounted() {
    this.dialog = nodecg.getDialog('run-modification-dialog') as any;

    // Attaching this function to the window for easy access from dashboard panels.
    (window as any).open = (opts: { mode: Mode; runData?: RunData; }) => this.open(opts);

    // Small hack to make the NodeCG dialog look a little better for us, not perfect yet.
    const elem = this.dialog.getElementsByTagName('paper-dialog-scrollable')[0] as HTMLElement;
    elem.style.marginBottom = '12px';
  },
  methods: {
    open(opts: { mode: Mode; runData?: RunData; }) {
      // Waits for dialog to actually open before changing storage.
      this.dialog.open();
      document.addEventListener('dialog-opened', () => {
        this.mode = opts.mode;
        this.err = undefined;
        if (opts.runData) {
          store.commit('updateRunData', { value: opts.runData });
          if (opts.mode === 'Duplicate') {
            store.commit('setAsDuplicate');
          }
        } else {
          store.commit('resetRunData');
          store.commit('addNewTeam');
        }
      }, { once: true });
      document.addEventListener('dialog-confirmed', this.confirm, { once: true });
      document.addEventListener('dialog-dismissed', this.dismiss, { once: true });
    },
    addNewTeam() {
      store.commit('addNewTeam');
    },
    attemptSave() {
      this.err = undefined;
      store.dispatch('saveRunData').then(() => {
        this.close(true);
      }).catch((err) => {
        this.err = err;
      });
    },
    close(confirm: boolean) {
      this.dialog._updateClosingReasonConfirmed(confirm); // eslint-disable-line
      this.dialog.close();
    },
    confirm() {
      document.removeEventListener('dialog-dismissed', this.dismiss);
    },
    dismiss() {
      document.removeEventListener('dialog-confirmed', this.confirm);
    },
  },
});
</script>

<style scoped>
  .Error {
    color: red;
  }

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
