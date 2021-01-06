<i18n>
{
  "en": {
    "reset": "Reset"
  },
  "ja": {
    "reset": "リセット"
  }
}
</i18n>

<template>
  <div>
    <v-tooltip
      top
      :disabled="state === 'stopped'"
    >
      <template v-slot:activator="{ on }">
        <span v-on="on">
          <v-btn
            :disabled="state === 'stopped'"
            @click="button"
          >
            <v-icon>mdi-rewind</v-icon>
          </v-btn>
        </span>
      </template>
      <span>{{ $t('reset') }}</span>
    </v-tooltip>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import { State } from 'vuex-class';
import { Timer } from 'schemas';

@Component
export default class extends Vue {
  @State timer!: Timer;

  get state(): Timer['state'] {
    return this.timer.state;
  }

  async button(): Promise<void> {
    try {
      await nodecg.sendMessage('timerReset');
    } catch (err) {
      // error
    }
  }
}
</script>
