<i18n>
{
  "en": {
    "panelTitle": "Add/Remove Runs",
    "removeAllRuns": "Remove All Runs"
  },
  "ja": {
    "panelTitle": "走者情報の追加/削除",
    "removeAllRuns": "全ての走者情報の削除"
  }
}
</i18n>

<template>
  <v-app>
    <v-btn
      class="green darken-2"
      @click="openAddDialog"
    >
      <v-icon class="pr-2">
        mdi-plus-box
      </v-icon>{{ $t('addNewRun') }}
    </v-btn>
    <v-btn
      class="red darken-2 mt-3"
      :disabled="disableRemoveAll"
      @click="removeAllRunsConfirm"
    >
      <v-icon class="pr-2">
        mdi-delete
      </v-icon>{{ $t('removeAllRuns') }}
    </v-btn>
  </v-app>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import { Timer } from '@nodecg-speedcontrol/types/schemas';
import { RunModification, Alert } from '@nodecg-speedcontrol/types';
import { getDialog } from '../_misc/helpers';
import { replicantNS } from '../_misc/replicant_store';

@Component
export default class extends Vue {
  @replicantNS.State((s) => s.reps.timer) readonly timer!: Timer;

  get disableRemoveAll(): boolean {
    return ['running', 'paused'].includes(this.timer.state);
  }

  openAddDialog(): void {
    const dialog = getDialog('run-modification-dialog') as RunModification.Dialog;
    if (dialog) {
      dialog.openDialog({ mode: 'New' });
    }
  }

  removeAllRunsConfirm(): void {
    const dialog = getDialog('alert-dialog') as Alert.Dialog;
    if (dialog) {
      dialog.openDialog({
        name: 'RemoveAllRunsConfirm',
        func: this.removeAllRuns,
      });
    }
  }

  async removeAllRuns(confirm: boolean): Promise<void> {
    if (confirm) {
      try {
        await nodecg.sendMessage('removeAllRuns');
      } catch (err) {
        // unsuccessful
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
