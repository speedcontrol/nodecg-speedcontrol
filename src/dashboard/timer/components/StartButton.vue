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
            :disabled="state === 'finished' || (isEnabledForceCheck && !checklistComplete)"
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
import { Vue, Component, Watch } from 'vue-property-decorator';
import { State } from 'vuex-class';
import { Timer, Checklist } from 'schemas';
import { Configschema } from 'configschema';

@Component
export default class extends Vue {
  @State timer!: Timer;
  @State checklist!: Checklist;

  checklistComplete = false;

  get state(): string {
    return this.timer.state;
  }

  get config(): Configschema['checklist'] {
    return (nodecg.bundleConfig as Configschema).checklist;
  }

  get isEnabledForceCheck(): boolean {
    return this.config.enabled
    && this.checklist.length !== 0
    && this.config.forceCheckBeforeStartTimer;
  }

  @Watch('checklist', { immediate: true })
  onChecklistChange(val: Checklist): void {
    this.updateChecklistComplete(val);
  }

  updateChecklistComplete(checklist: Checklist): void {
    this.checklistComplete = checklist.every((checkbox) => checkbox.complete);
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
