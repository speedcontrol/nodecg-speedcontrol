<template>
  <v-app>
    <!-- Oengus ID Field -->
    <v-text-field
      v-model="marathonId"
      filled
      hide-details
      label="Oengus marathon ID"
      placeholder="id"
      prefix="/marathon/"
    />
    <div :style="{ margin: '5px 0'}">
      Insert the Oengus marathon ID (not include "/schedule") above and press
      the "Import Schedule Data" button to import schedule.
    </div>
    <!-- Switch use Japanese or not for importing data -->
    <v-switch
      v-model="useJapanese"
      hide-details
      label="Use Japanese name"
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
      Import Schedule Data
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
