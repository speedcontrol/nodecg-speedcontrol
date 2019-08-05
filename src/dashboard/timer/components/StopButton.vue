<template>
  <button
    :disabled="isDisabled"
    @click="button"
  >
    Stop
  </button>
</template>

<script lang="ts">
import Vue from 'vue';
import { nodecg } from '../../_misc/nodecg';
import { store } from '../../_misc/replicant-store';

export default Vue.extend({
  name: 'StopButton',
  computed: {
    isDisabled() {
      return store.state.timer.state !== 'running';
    },
  },
  methods: {
    button() {
      nodecg.sendMessage('stopTimer');
    },
  },
});
</script>
