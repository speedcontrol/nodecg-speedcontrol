<i18n>
{
  "en": {
    "alertText": "Importing will remove all currently added runs, continue?"
      + "\n\nThe currently active run will not be modified."
  }
}
</i18n>

<template>
  <div>
    <div>{{ $t('alertText') }}</div>
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
