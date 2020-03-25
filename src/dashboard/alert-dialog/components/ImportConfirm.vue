<i18n>
{
  "en": {
    "alertText": "Importing will remove all currently added runs, continue?",
    "alertText2": "The currently active run will not be modified."
  },
  "ja": {
    "alertText": null,
    "alertText2": null
  }
}
</i18n>

<template>
  <div>
    <div>
      {{ $t('alertText') }}
      <br><br>{{ $t('alertText2') }}
    </div>
    <br>
    <div :style="{ float: 'right' }">
      <v-btn @click="$emit('confirm')">
        {{ $t('ok') }}
      </v-btn>
      <v-btn @click="$emit('dismiss')">
        {{ $t('cancel') }}
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({});
</script>
