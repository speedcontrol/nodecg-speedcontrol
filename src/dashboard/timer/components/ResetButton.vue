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
import { Timer } from '@nodecg-speedcontrol/types/schemas';
import { replicantNS } from '@nodecg-speedcontrol/dashboard/_misc/replicant_store';

@Component
export default class extends Vue {
  @replicantNS.State((s) => s.reps.timer) readonly timer!: Timer;

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
