<template>
  <div id="App">
    <h1 v-if="newRun">
      Add Run
    </h1>
    <h1 v-else>
      Edit Run
    </h1>
    <div>
      Currently set run is {{ runData.id }}
    </div>
    <div class="DialogButtons">
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
import { nodecg } from '../_misc/nodecg';
import { RunData } from '../../../types';

export default Vue.extend({
  data() {
    return {
      dialog: undefined as any,
      newRun: true,
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
      // do confirm stuff here
      document.removeEventListener('dialog-dismissed', this.dismiss);
    },
    dismiss() {
      // do dismiss stuff here
      document.removeEventListener('dialog-confirmed', this.confirm);
    },
  },
});
</script>

<style scoped>
  .DialogButtons {
    float: right;
  }
</style>
