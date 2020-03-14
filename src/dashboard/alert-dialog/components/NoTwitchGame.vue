<i18n>
{
  "en": {
    "alertText": "The Twitch game directory could not be set correctly, it has been set to default. Change this manually if possible."
  },
  "ja": {
    "alertText": "The Twitch game directory could not be set correctly, it has been set to default. Change this manually if possible."
  }
}
</i18n>

<template>
  <div>
    <div>{{ $t('alertText') }}</div>
    <br>
    <div :style="{ float: 'right' }">
      <v-btn @click="$emit('dismiss')">
        {{ $t('ok') }}
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({});
</script>
