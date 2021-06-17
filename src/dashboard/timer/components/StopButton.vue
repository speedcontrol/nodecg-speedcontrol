<i18n>
{
  "en": {
    "stop": "Stop"
  },
  "ja": {
    "stop": "ストップ"
  }
}
</i18n>

<template>
  <div>
    <v-tooltip
      top
      :disabled="isDisabled"
    >
      <template v-slot:activator="{ on }">
        <span v-on="on">
          <v-btn
            :disabled="isDisabled"
            @click="button"
          >
            <v-icon v-if="forfeit">mdi-close</v-icon>
            <v-icon v-else>mdi-check</v-icon>
          </v-btn>
        </span>
      </template>
      <span v-if="forfeit">{{ $t('forfeit') }}</span>
      <span v-else>{{ $t('stop') }}</span>
    </v-tooltip>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { Timer } from '@nodecg-speedcontrol/types/schemas';
import { RunDataTeam } from '@nodecg-speedcontrol/types';
import { replicantNS } from '@nodecg-speedcontrol/dashboard/_misc/replicant_store';

@Component
export default class extends Vue {
  @Prop({ type: Object }) readonly info!: RunDataTeam | undefined;
  @Prop(Boolean) readonly forfeit!: boolean;
  @replicantNS.State((s) => s.reps.timer) readonly timer!: Timer;

  get isDisabled(): boolean {
    return (
      this.info?.id && !!this.timer.teamFinishTimes[this.info.id as string]
    ) || !['running', 'paused'].includes(this.timer.state);
  }

  async button(): Promise<void> {
    try {
      await nodecg.sendMessage('timerStop', {
        id: this.info?.id,
        forfeit: this.forfeit,
      });
    } catch (err) {
      // catch
    }
  }
}
</script>
