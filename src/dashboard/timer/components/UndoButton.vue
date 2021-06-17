<i18n>
{
  "en": {
    "undo": "Undo"
  },
  "ja": {
    "undo": "元に戻す"
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
            <v-icon>mdi-undo</v-icon>
          </v-btn>
        </span>
      </template>
      <span>{{ $t('undo') }}</span>
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
  @replicantNS.State((s) => s.reps.timer) readonly timer!: Timer;

  get isDisabled(): boolean {
    return (
      // If no team information has been supplied.
      !this.info?.id && this.timer.state !== 'finished'
    ) || (
      // If team information is supplied, need to check if the team is finished.
      !!this.info?.id && (!this.timer.teamFinishTimes[this.info.id]
      || !['running', 'finished'].includes(this.timer.state))
    );
  }

  async button(): Promise<void> {
    try {
      await nodecg.sendMessage('timerUndo', this.info?.id);
    } catch (err) {
      // catch
    }
  }
}
</script>
