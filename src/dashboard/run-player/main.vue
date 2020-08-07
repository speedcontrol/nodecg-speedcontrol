<i18n>
{
  "en": {
    "panelTitle": "Run Player",
    "returnToStart": "Return to Start",
    "noRunsLeft": "No Runs Left",
    "noRunsAdded": "No Runs Added",
    "cannotChange": "Cannot change run while timer is {state}"
  },
  "ja": {
    "panelTitle": "現在の走者情報",
    "returnToStart": "最初に戻す",
    "noRunsLeft": "残りの走者情報はありません",
    "noRunsAdded": "走者情報がありません",
    "cannotChange": "タイマーが動作している間は編集できません。({state})"
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
        :title="nextRunStr"
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
              {{ nextRunStr }}
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
import { Vue, Component } from 'vue-property-decorator';
import { State } from 'vuex-class';
import { RunDataArray, RunDataActiveRun, RunDataActiveRunSurrounding, Timer } from 'schemas';
import { RunData, Dialog, Alert } from 'types';
import RunList from '../_misc/components/RunList.vue';
import { getDialog } from '../_misc/helpers';

@Component({
  components: {
    RunList,
  },
})
export default class extends Vue {
  @State runDataArray!: RunDataArray;
  @State('runDataActiveRun') activeRun!: RunDataActiveRun;
  @State runDataActiveRunSurrounding!: RunDataActiveRunSurrounding;
  @State timer!: Timer;

  get nextRun(): RunData | undefined {
    return this.runDataArray.find((run) => run.id === this.runDataActiveRunSurrounding.next);
  }

  get nextRunStr(): string {
    if (this.nextRun) {
      const arr = [
        this.nextRun.game || '?',
        this.nextRun.category,
      ].filter(Boolean);
      return arr.join(' - ');
    }
    return '?';
  }

  get timerState(): string {
    return this.timer.state;
  }

  get disableChange(): boolean {
    return ['running', 'paused'].includes(this.timerState);
  }

  returnToStartConfirm(): void {
    const dialog = getDialog('alert-dialog') as Alert.Dialog;
    if (dialog) {
      dialog.openDialog({
        name: 'ReturnToStartConfirm',
        func: this.returnToStart,
      });
    }
  }

  async returnToStart(confirm: boolean): Promise<void> {
    if (confirm) {
      try {
        await nodecg.sendMessage('returnToStart');
      } catch (err) {
        // run removal unsuccessful
      }
    }
  }

  async playNextRun(): Promise<void> {
    if (this.nextRun) {
      try {
        const noTwitchGame = await nodecg.sendMessage('changeToNextRun');
        if (noTwitchGame) {
          const dialog = getDialog('alert-dialog') as Alert.Dialog;
          if (dialog) {
            dialog.openDialog({ name: 'NoTwitchGame' });
          }
        }
      } catch (err) {
        // run change unsuccessful
      }
    }
  }

  mounted(): void {
    if (window.frameElement?.parentElement) {
      window.frameElement.parentElement.setAttribute(
        'display-title',
        this.$t('panelTitle') as string,
      );
    }
  }
}
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
