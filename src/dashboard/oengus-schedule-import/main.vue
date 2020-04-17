<i18n>
{
  "en": {
    "panelTitle": "Oengus Schedule Import",
    "shortname": "Oengus Marathon Shortname",
    "helpText": "Insert the Oengus marathon shortname (not including \"/schedule\") above and press the \"Import Schedule Data\" button.",
    "importInProgressHelpText": "Import currently in progress...",
    "useJapaneseNames": "Use Japanese names?",
    "import": "Import Schedule Data",
    "importProgress": "Importing {item}/{total}"
  },
  "ja": {
    "panelTitle": "Oengusからインポート",
    "shortname": "Oengusマラソンの略称",
    "helpText": "上記にインポートしたいOengusのイベントの略称を入力し(\"/schedule\"を含めないでください)、「スケジュール情報のインポート」ボタンを押してください。",
    "importInProgressHelpText": "インポート処理の実行中...",
    "useJapaneseNames": "日本語ユーザーネームを使用しますか？",
    "import": "スケジュール情報のインポート",
    "importProgress": "{item}/{total}件をインポート"
  }
}
</i18n>

<template>
  <v-app>
    <!-- Oengus Shortname Field -->
    <v-text-field
      v-model="marathonShort"
      filled
      hide-details
      :label="$t('shortname')"
      placeholder="id"
      prefix="/marathon/"
    />
    <div class="mt-2">
      <template v-if="!importStatus.importing">
        <div>
          {{ $t('helpText') }}
        </div>
        <!-- Switch use Japanese or not for importing data -->
        <v-switch
          v-model="useJapanese"
          class="ma-1"
          hide-details
          :label="$t('useJapaneseNames')"
        />
      </template>
      <template v-else>
        {{ $t('importInProgressHelpText') }}
      </template>
    </div>
    <div class="mt-1">
      <!-- Import Button, if importing -->
      <v-btn
        v-if="importStatus.importing"
        :disabled="true"
        block
      >
        {{ $t('importProgress', { item: importStatus.item, total: importStatus.total }) }}
      </v-btn>
      <!-- Import Button, if not importing -->
      <v-btn
        v-else
        block
        @click="importConfirm"
      >
        {{ $t('import') }}
      </v-btn>
    </div>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import { OengusImportStatus } from 'schemas';
import { store as repStore } from '../_misc/replicant-store';

export default Vue.extend({
  data() {
    return {
      marathonShort: nodecg.bundleConfig.oengus.defaultMarathon || '',
      useJapanese: nodecg.bundleConfig.oengus.useJapanese,
    };
  },
  computed: {
    importStatus(): OengusImportStatus {
      return repStore.state.oengusImportStatus;
    },
  },
  mounted() {
    if (window.frameElement) {
      window.frameElement.parentElement.setAttribute('display-title', this.$t('panelTitle'));
    }
  },
  methods: {
    importConfirm(): void {
      const alertDialog = nodecg.getDialog('alert-dialog') as any; // eslint-disable-line @typescript-eslint/no-explicit-any, max-len
      alertDialog.querySelector('iframe').contentWindow.open({
        name: 'ImportConfirm',
        func: this.import,
      });
    },
    import(confirm: boolean): void {
      if (confirm) {
        nodecg.sendMessage('importOengusSchedule', {
          marathonShort: this.marathonShort,
          useJapanese: this.useJapanese,
        }).then(() => {
          // successful
        }).catch(() => {
          // unsuccessful
        });
      }
    },
  },
});
</script>
