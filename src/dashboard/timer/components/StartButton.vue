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
import Vue from 'vue';
import { nodecg } from '../../_misc/nodecg';
import { store } from '../../_misc/replicant-store';

export default Vue.extend({
  name: 'StartButton',
  computed: {
    state(): string {
      return store.state.timer.state;
    },
  },
  methods: {
    button(): void {
      if (this.state === 'stopped' || this.state === 'paused') {
        nodecg.sendMessage('timerStart').then(() => {
          // successful
        }).catch(() => {
          // error
        });
      } else if (this.state === 'running') {
        nodecg.sendMessage('timerPause').then(() => {
          // successful
        }).catch(() => {
          // error
        });
      }
    },
  },
});
</script>
