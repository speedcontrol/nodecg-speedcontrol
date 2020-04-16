<i18n>
{
  "en": {
    "alertText": "Are you sure you want to return to the start?"
  },
  "ja": {
    "alertText": "走者情報を最初に戻してもよろしいですか？"
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
