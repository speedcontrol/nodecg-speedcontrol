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
import { State } from 'vuex-class';
import { Timer } from 'schemas';

@Component
export default class extends Vue {
  @State timer!: Timer;
  time = '00:00:00';

  get state(): Timer['state'] {
    return this.timer.state;
  }

  get serverTime(): string {
    return this.timer.time;
  }

  get bgColour(): string {
    switch (this.timer.state) {
      case 'stopped':
      case 'paused':
      default:
        return '#455A64';
      case 'running':
        return '';
      case 'finished':
        return '#388E3C';
    }
  }

  get disableEditing(): boolean {
    return ['running', 'finished'].includes(this.timer.state);
  }

  @Watch('serverTime', { immediate: true })
  onServerTimeChange(val: string): void {
    this.time = val;
  }

  finishEdit(event: Event): void {
    if (this.time.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
      nodecg.sendMessage('timerEdit', this.time).then(() => {
        // successful
      }).catch(() => {
        // error
      });
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
