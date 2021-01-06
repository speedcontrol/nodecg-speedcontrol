<i18n>
{
  "en": {
    "alertText": "Are you sure you want to remove all runs?",
    "alertText2": "This will also remove the currently active run."
  },
  "ja": {
    "alertText": "全ての走者情報を削除してもよろしいですか？",
    "alertText2": "これは現在実行中の走者情報も削除します。"
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
import { Vue, Component } from 'vue-property-decorator';

@Component
export default class extends Vue {}
</script>
