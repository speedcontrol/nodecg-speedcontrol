<i18n>
{
  "en": {
    "alertText": "Importing will remove all currently added runs, continue?",
    "alertText2": "The currently active run will not be modified."
  },
  "ja": {
    "alertText": "インポートを行うと現在追加されている走者情報が全て削除されますが、続行しますか？",
    "alertText2": "現在実行中の走者情報は変更されません。"
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
