<i18n>
{
  "en": {
    "pause": "Pause",
    "resume": "Resume",
    "play": "Play"
  },
  "ja": {
    "pause": "ポーズ",
    "resume": "再開",
    "play": "開始"
  }
}
</i18n>

<template>
  <div>
    <v-tooltip
      top
      :disabled="state === 'finished'"
    >
      <template v-slot:activator="{ on }">
        <span v-on="on">
          <v-btn
            :disabled="state === 'finished'"
            @click="button"
          >
            <v-icon v-if="state === 'running'">
              mdi-pause
            </v-icon>
            <v-icon v-else>
              mdi-play
            </v-icon>
          </v-btn>
        </span>
      </template>
      <span v-if="state === 'running'">{{ $t('pause') }}</span>
      <span v-else-if="state === 'paused'">{{ $t('resume') }}</span>
      <span v-else>{{ $t('play') }}</span>
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

  get state(): string {
    return this.timer.state;
  }

  async button(): Promise<void> {
    try {
      if (this.state === 'stopped' || this.state === 'paused') {
        await nodecg.sendMessage('timerStart');
      } else if (this.state === 'running') {
        await nodecg.sendMessage('timerPause');
      }
    } catch (err) {
      // catch
    }
  }
}
</script>
