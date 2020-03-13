<i18n>
{
  "en": {
    "panelTitle": "Run Player",
    "returnToStart": "Return to Start",
    "noRunsLeft": "No Runs Left",
    "noRunsAdded": "No Runs Added",
    "cannotChange": "Cannot change run while timer is {state}"
  }
}
</i18n>

<template>
  <v-app>
    <div>
      <v-btn
        block
        :disabled="!activeRun || disableChange"
        @click="returnToStartConfirm"
      >
        {{ $t('returnToStart') }}
      </v-btn>
    </div>
    <div>
      <v-btn
        class="NextRunBtn"
        width="100%"
        block
        :disabled="disableChange || !nextRun"
        @click="playNextRun"
      >
        <div
          class="d-flex justify-center"
          :style="{ width: '100%' }"
        >
          <template v-if="nextRun">
            <div>
              <v-icon left>
                mdi-play
              </v-icon>
            </div>
            <div :style="{ overflow: 'hidden' }">
              {{ nextRunGameName }}
            </div>
          </template>
          <div v-else-if="runDataArray.length">
            {{ $t('noRunsLeft') }}
          </div>
          <div v-else>
            {{ $t('noRunsAdded') }}
          </div>
        </div>
      </v-btn>
      <v-alert
        v-if="disableChange"
        dense
        type="info"
      >
        {{ $t('cannotChange', { state: timerState }) }}
      </v-alert>
    </div>
    <run-list />
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import RunList from '../_misc/components/RunList/RunList.vue';
import { store } from '../_misc/replicant-store';
import { RunData, RunDataArray, RunDataActiveRun } from '../../../types';
import { RunDataActiveRunSurrounding } from '../../../schemas';

export default Vue.extend({
  components: {
    RunList,
  },
  computed: {
    runDataArray(): RunDataArray {
      return store.state.runDataArray;
    },
    activeRun(): RunDataActiveRun {
      return store.state.runDataActiveRun;
    },
    runDataActiveRunSurrounding(): RunDataActiveRunSurrounding {
      return store.state.runDataActiveRunSurrounding;
    },
    nextRun(): RunData | undefined {
      return this.runDataArray.find((run) => run.id === this.runDataActiveRunSurrounding.next);
    },
    nextRunGameName(): string {
      if (this.nextRun && this.nextRun.game) {
        return this.nextRun.game;
      }
      return '(The Run With No Name)';
    },
    timerState(): string {
      return store.state.timer.state;
    },
    disableChange(): boolean {
      return ['running', 'paused'].includes(this.timerState);
    },
  },
  mounted() {
    if (window.frameElement) {
      window.frameElement.parentElement.setAttribute('display-title', this.$t('panelTitle'));
    }
  },
  methods: {
    returnToStartConfirm(): void {
      const alertDialog = nodecg.getDialog('alert-dialog') as any; // eslint-disable-line @typescript-eslint/no-explicit-any, max-len
      alertDialog.querySelector('iframe').contentWindow.open({
        name: 'ReturnToStartConfirm',
        func: this.returnToStart,
      });
    },
    returnToStart(confirm: boolean): void {
      if (confirm) {
        nodecg.sendMessage('returnToStart').then(() => {
          // run removal successful
        }).catch(() => {
          // run removal unsuccessful
        });
      }
    },
    playNextRun(): void {
      if (this.nextRun) {
        nodecg.sendMessage('changeToNextRun').then((noTwitchGame) => {
          if (noTwitchGame) {
            const alertDialog = nodecg.getDialog('alert-dialog') as any; // eslint-disable-line @typescript-eslint/no-explicit-any, max-len
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

<style scoped>
  .v-btn {
    margin-bottom: 5px;
  }
</style>

<style>
  .NextRunBtn > .v-btn__content {
    width: 100%;
  }
</style>
