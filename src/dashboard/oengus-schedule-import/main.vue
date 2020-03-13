<i18n>
{
  "en": {
    "shortname": "Oengus Marathon Shortname",
    "helpText": "Insert the Oengus marathon shortname (not including \"/schedule\")"
      + " above and press the \"Import Schedule Data\" button.",
    "useJapaneseNames": "Use Japanese names?",
    "import": "Import Schedule Data"
  }
}
</i18n>

<template>
  <v-app>
    <!-- Oengus ID Field -->
    <v-text-field
      v-model="marathonId"
      filled
      hide-details
      :label="$t('shortname')"
      placeholder="id"
      prefix="/marathon/"
    />
    <div :style="{ margin: '5px 0'}">
      {{ $t('helpText') }}
    </div>
    <!-- Switch use Japanese or not for importing data -->
    <v-switch
      v-model="useJapanese"
      hide-details
      :label="$t('useJapaneseNames')"
      color="primary"
      :style="{ margin: '5px 0'}"
    />
    <!-- "Import Schedule Data" Button -->
    <v-btn
      :style="{ margin: '5px 0' }"
      :disabled="importing"
      :loading="importing"
      @click="importConfirm"
    >
      {{ $t('import') }}
    </v-btn>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  data() {
    return {
      marathonId: nodecg.bundleConfig.oengus.defaultMarathon || '',
      useJapanese: nodecg.bundleConfig.oengus.useJapanese,
      importing: false,
    };
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
        this.importing = true;
        nodecg.sendMessage('importOengusSchedule', {
          marathonId: this.marathonId,
          useJapanese: this.useJapanese,
        }).then(() => {
          this.importing = false;
        }).catch(() => {
          this.importing = false;
        });
      }
    },
  },
});
</script>
