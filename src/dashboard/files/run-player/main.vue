<template>
  <v-app>
    <div>
      <v-btn
        block
        :disabled="!activeRun || disableChange"
        @click="returnToStartConfirm"
      >
        Return To Start
      </v-btn>
    </div>
    <div class="NextRun">
      <v-btn
        block
        :disabled="disableChange || !nextRun"
        @click="playNextRun"
      >
        <span
          v-if="nextRun"
        >
          <v-icon>mdi-play</v-icon>{{ (nextRun) ? nextRun.game : '' }}
        </span>
        <span
          v-else
        >
          End of marathon or no runs imported
        </span>
      </v-btn>
    </div>
    <run-list></run-list>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import RunList from '../_misc/components/RunList/RunList.vue';
import { store } from '../_misc/replicant-store';
import { RunData } from '../../../../types';

export default Vue.extend({
  components: {
    RunList,
  },
  computed: {
    runDataArray() {
      return store.state.runDataArray;
    },
    activeRun() {
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

<style>
  button > span {
    overflow: hidden;
    flex: unset !important;
  }
</style>

<style scoped>
  .v-btn {
    margin-bottom: 5px;
  }
</style>
