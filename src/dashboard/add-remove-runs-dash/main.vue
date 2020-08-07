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
      <v-icon>mdi-plus-box</v-icon>{{ $t('addNewRun') }}
    </v-btn>
    <v-btn
      class="red darken-2"
      :disabled="disableRemoveAll"
      @click="removeAllRunsConfirm"
    >
      <v-icon>mdi-delete</v-icon>{{ $t('removeAllRuns') }}
    </v-btn>
  </v-app>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import { State } from 'vuex-class';
import { Timer } from 'schemas';
import { Dialog, RunModification, Alert } from 'types';

@Component
export default class extends Vue {
  @State timer!: Timer;

  get disableRemoveAll(): boolean {
    return ['running', 'paused'].includes(this.timer.state);
  }

  openAddDialog(): void {
    const dialog = nodecg.getDialog('run-modification-dialog') as Dialog;
    (dialog.querySelector('iframe').contentWindow as RunModification.Dialog)
      .openDialog({ mode: RunModification.Mode.New });
  }

  removeAllRunsConfirm(): void {
    const dialog = nodecg.getDialog('alert-dialog') as Dialog;
    (dialog.querySelector('iframe').contentWindow as Alert.Dialog).openDialog({
      name: 'RemoveAllRunsConfirm',
      func: this.removeAllRuns,
    });
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

<style scoped>
  .v-btn:not(:first-of-type) {
    margin-top: 10px;
  }

  .v-icon {
    padding-right: 5px;
  }
</style>
