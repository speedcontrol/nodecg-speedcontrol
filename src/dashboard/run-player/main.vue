<template>
  <div id="App">
    <div>
      <button
        @click="returnToStart"
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
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import clone from 'clone';
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
    nextRun(): RunData | null {
      const currentRunId = (this.runDataActiveRun) ? this.runDataActiveRun.id : undefined;
      const currentRunIndex = this.runDataArray.findIndex(run => run.id === currentRunId);
      return clone(this.runDataArray[currentRunIndex + 1]) || null;
    },
  },
  methods: {
    returnToStart() {
      nodecg.sendMessage('removeActiveRun').then(() => {
        // run removal successful
      }).catch(() => {
        // run removal unsuccessful
      });
    },
    playNextRun() {
      if (this.nextRun) {
        nodecg.sendMessage('changeActiveRun', this.nextRun.id).then(() => {
          // run change successful
        }).catch(() => {
          // run change unsuccessful
        });
      }
    },
  },
});
</script>
