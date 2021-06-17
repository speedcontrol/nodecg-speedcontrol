<i18n>
{
  "en": {
    "alertText": "Are you sure you want to delete this run?"
  },
  "ja": {
    "alertText": "この走者情報を削除してもよろしいですか？"
  }
}
</i18n>

<template>
  <div>
    <div>
      {{ $t('alertText') }}
      <div
        v-if="runStr"
        :style="{
          'margin-top': '10px',
          'font-style': 'italic',
        }"
      >
        {{ runStr }}
      </div>
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
import { Vue, Component, Prop } from 'vue-property-decorator';
import { RunData } from '@nodecg-speedcontrol/types';

@Component
export default class extends Vue {
  @Prop({ type: Object, required: true }) readonly alertData!: { runData?: RunData };

  get runStr(): string | undefined {
    if (this.alertData.runData
      && (this.alertData.runData.game || this.alertData.runData.category)) {
      const arr = [
        this.alertData.runData.game || '?',
        this.alertData.runData.category,
      ].filter(Boolean);
      return arr.join(' - ');
    }
    return undefined;
  }
}
</script>
