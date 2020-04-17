<i18n>
{
  "en": {
    "alertText": "The Twitch game directory could not be set correctly, it has been set to default. Change this manually if possible."
  },
  "ja": {
    "alertText": "Twitchゲームカテゴリーを正しく設定することが出来なかった為、デフォルト設定に変更しました。可能であれば手動で変更してください。"
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
