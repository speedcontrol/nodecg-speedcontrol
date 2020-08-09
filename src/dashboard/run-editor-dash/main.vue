<i18n>
{
  "en": {
    "panelTitle": "Run Editor",
    "editActive": "Edit Currently Active Run"
  },
  "ja": {
    "panelTitle": "走者情報の編集",
    "editActive": "現在進行中の走者情報の編集"
  }
}
</i18n>

<template>
  <v-app>
    <v-btn
      :disabled="!activeRun"
      :style="{ 'margin-bottom': '10px' }"
      @click="editActiveRun"
    >
      {{ $t('editActive') }}
    </v-btn>
    <run-list editor />
  </v-app>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import { State } from 'vuex-class';
import { RunDataActiveRun } from 'schemas';
import { Dialog, RunModification } from 'types';
import RunList from '../_misc/components/RunList.vue';
import { getDialog } from '../_misc/helpers';

@Component({
  components: {
    RunList,
  },
})
export default class extends Vue {
  @State('runDataActiveRun') activeRun!: RunDataActiveRun | undefined;

  editActiveRun(): void {
    if (this.activeRun) {
      const dialog = getDialog('run-modification-dialog') as RunModification.Dialog;
      if (dialog) {
        dialog.openDialog({
          mode: 'EditActive',
          runData: this.activeRun,
        });
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
