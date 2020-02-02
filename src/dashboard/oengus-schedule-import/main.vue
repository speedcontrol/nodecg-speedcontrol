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
    ></v-text-field>
    <div :style="{ margin: '5px 0'}">
      Insert the Oengus marathon ID (not include "/schedule") above and press
      the "Import Schedule Data" button to import schedule.
    </div>
    <!-- Switch use Japanese or not for importing data -->
    <v-switch
      v-model="useJapanese"
      hide-details
      label="Using Japanese name"
      color="primary"
      :style="{ margin: '5px 0'}"
    >
    </v-switch>
    <!-- "Import Schedule Data" Button -->
    <v-btn
      :style="{ margin: '5px 0' }"
      :disabled="importing"
      :loading="importing"
      @click="importSchedule"
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
    importSchedule(): void {
      this.importing = true;
      nodecg.sendMessage('importOengusSchedule', {
        marathonId: this.marathonId,
        useJapanese: this.useJapanese,
      }).then(() => {
        this.importing = false;
      }).catch(() => {
        this.importing = false;
      });
    },
  },
});
</script>
