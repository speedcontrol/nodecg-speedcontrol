<template>
  <button
    :disabled="isDisabled"
    @click="button"
  >
    Reset
  </button>
</template>

<script lang="ts">
import Vue from 'vue';
import { nodecg } from '../../_misc/nodecg';
import { store } from '../../_misc/replicant-store';

export default Vue.extend({
  name: 'ResetButton',
  computed: {
    isDisabled() {
      return store.state.timer.state === 'stopped';
    },
  },
  methods: {
    button() {
      nodecg.sendMessage('resetTimer').then(() => {
        // successful
      }).catch(() => {
        // error
      });
    },
  },
});
</script>
