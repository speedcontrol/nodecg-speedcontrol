<template>
  <v-app>
    <div>
      <v-btn
        block
        :disabled="!activeRun || disableChange"
        @click="returnToStartConfirm"
      >
        Return to Start
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
          <v-icon left>mdi-play</v-icon>{{ nextRunGameName }}
        </span>
        <span
          v-else-if="runDataArray.length"
        >
          No Runs Left
        </span>
        <span v-else>
          No Runs Added
        </span>
      </v-btn>
      <v-alert
        v-if="disableChange"
        dense
        type="info"
      >
        Cannot change run while timer is {{ timerState }}.
      </v-alert>
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
      return this.runDataArray.find((run) => run.id === this.runDataActiveRunSurrounding.next);
    },
    nextRunGameName() {
      if (this.nextRun && this.nextRun.game) {
        return `${this.nextRun.game.slice(0, 35)}${(this.nextRun.game.length > 35) ? '...' : ''}`;
      }
      return '(The Run with No Name)';
    },
    timerState() {
      return store.state.timer.state;
    },
    disableChange() {
      return ['running', 'paused'].includes(this.timerState);
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
        nodecg.sendMessage('changeToNextRun').then((noTwitchGame) => {
          if (noTwitchGame) {
            const alertDialog = nodecg.getDialog('alert-dialog') as any;
            alertDialog.querySelector('iframe').contentWindow.open({
              name: 'NoTwitchGame',
            });
          }
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
