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
    <run-list :editor="true" />
  </v-app>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import { State } from 'vuex-class';
import { RunDataActiveRun } from 'schemas';
import RunList from '../_misc/components/RunList/RunList.vue';

@Component({
  components: {
    RunList,
  },
})
export default class extends Vue {
  @State('runDataActiveRun') activeRun!: RunDataActiveRun;

  editActiveRun(): void {
    if (this.activeRun) {
      const runInfoDialog = nodecg.getDialog('run-modification-dialog') as any; // eslint-disable-line @typescript-eslint/no-explicit-any, max-len
      runInfoDialog.querySelector('iframe').contentWindow.open({
        mode: 'EditActive',
        runData: this.activeRun,
      });
    }
  }

  mounted(): void {
    if (window.frameElement) {
      window.frameElement.parentElement.setAttribute(
        'display-title',
        this.$t('panelTitle') as string,
      );
    }
  }
}
</script>
