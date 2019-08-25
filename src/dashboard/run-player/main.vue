<template>
  <v-app>
    <div>
      <button
        :disabled="!runDataActiveRun || disableChange"
        @click="returnToStartConfirm"
      >
        Return To Start
      </button>
    </div>
    <br>
    <div v-if="runDataActiveRun">
      Current Run: {{ runDataActiveRun.game }}
    </div>
    <div v-else>
      At the start of the marathon :)
    </div>
    <br>
    <div v-if="nextRun">
      <button
        :disabled="disableChange"
        @click="playNextRun"
      >
        Play
      </button>
      <span>
        Next Run: {{ nextRun.game }}
      </span>
    </div>
    <div v-else>
      No more runs, marathon done :)
    </div>
    <br>
    <run
      v-for="run in runDataArray"
      :key="run.id"
      :run-data="run"
    ></run>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import Run from './components/Run.vue';
import { store } from '../_misc/replicant-store';
import { RunData } from '../../../types';

export default Vue.extend({
  components: {
    Run,
  },
  computed: {
    runDataArray() {
      return store.state.runDataArray;
    },
    runDataActiveRun() {
      return store.state.runDataActiveRun;
    },
    runDataActiveRunSurrounding() {
      return store.state.runDataActiveRunSurrounding;
    },
    nextRun(): RunData | undefined {
      return this.runDataArray.find(run => run.id === this.runDataActiveRunSurrounding.next);
    },
    disableChange() {
      return ['running', 'paused'].includes(store.state.timer.state);
    },
  },
  methods: {
    returnToStartConfirm() {
      const alertDialog = nodecg.getDialog('alert-dialog') as any;
      alertDialog.querySelector('iframe').contentWindow.open({
        name: 'ReturnToStartConfirm',
        func: this.returnToStart,
      });
    },
    returnToStart(confirm: boolean) {
      if (confirm) {
        nodecg.sendMessage('returnToStart').then(() => {
          // run removal successful
        }).catch(() => {
          // run removal unsuccessful
        });
      }
    },
    playNextRun() {
      if (this.nextRun) {
        nodecg.sendMessage('changeToNextRun').then(() => {
          // run change successful
        }).catch(() => {
          // run change unsuccessful
        });
      }
    },
  },
});
</script>
