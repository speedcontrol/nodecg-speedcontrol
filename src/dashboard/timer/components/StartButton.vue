<template>
  <button
    :disabled="isDisabled"
    @click="button"
  >
    {{ text }}
  </button>
</template>

<script lang="ts">
import Vue from 'vue';
import { nodecg } from '../../_misc/nodecg';
import { store } from '../../_misc/replicant-store';

export default Vue.extend({
  name: 'StartButton',
  computed: {
    isDisabled() {
      return store.state.timer.state === 'finished';
    },
    text() {
      const { state } = store.state.timer;
      switch (state) {
        case 'running':
          return 'Pause';
        case 'paused':
          return 'Resume';
        default:
          return 'Start';
      }
    },
  },
  methods: {
    button() {
      const { state } = store.state.timer;
      if (state === 'stopped' || state === 'paused') {
        nodecg.sendMessage('startTimer').then(() => {
          // successful
        }).catch(() => {
          // error
        });
      } else if (state === 'running') {
        nodecg.sendMessage('pauseTimer').then(() => {
          // successful
        }).catch(() => {
          // error
        });
      }
    },
  },
});
</script>
