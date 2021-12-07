<i18n>
{
  "en": {
    "editTip": "Click to edit, Enter to save"
  },
  "ja": {
    "editTip": "クリックすると編集が行え、Enterすると保存します"
  }
}
</i18n>

<template>
  <div>
    <v-tooltip
      bottom
      :disabled="disableEditing"
    >
      <template v-slot:activator="{ on }">
        <span v-on="on">
          <v-text-field
            v-model="time"
            class="TimerInput"
            solo
            single-line
            hide-details
            :background-color="bgColour"
            :readonly="disableEditing"
            @blur="abandonEdit"
            @keyup.enter="finishEdit"
          />
        </span>
      </template>
      <span>{{ $t('editTip') }}</span>
    </v-tooltip>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator';
import { Timer } from '@nodecg-speedcontrol/types/schemas';
import { replicantNS } from '@nodecg-speedcontrol/dashboard/_misc/replicant_store';

@Component
export default class extends Vue {
  @replicantNS.State((s) => s.reps.timer) readonly timer!: Timer;
  time = '00:00:00';

  get serverTime(): string {
    return this.timer.time;
  }

  get bgColour(): string {
    switch (this.timer.state) {
      case 'running':
        return '';
      case 'finished':
        return '#388E3C';
      case 'stopped':
      case 'paused':
      default:
        return '#455A64';
    }
  }

  get disableEditing(): boolean {
    return ['running', 'finished'].includes(this.timer.state);
  }

  @Watch('serverTime', { immediate: true })
  onServerTimeChange(val: string): void {
    this.time = val;
  }

  async finishEdit(event: Event): Promise<void> {
    if (this.time.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
      try {
        await nodecg.sendMessage('timerEdit', this.time);
      } catch (err) {
        // catch
      }
      (event.target as HTMLTextAreaElement).blur();
    }
  }

  abandonEdit(): void {
    this.time = this.serverTime;
  }
}
</script>

<style scoped>
  .TimerInput >>> input {
    text-align: center;
    font-size: 25px;
  }
</style>
