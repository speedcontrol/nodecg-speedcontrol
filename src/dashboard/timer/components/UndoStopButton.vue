<template>
  <button
    :disabled="isDisabled"
    @click="button"
  >
    Undo Stop
  </button>
</template>

<script lang="ts">
import Vue from 'vue';
import { nodecg } from '../../_misc/nodecg';
import { store } from '../../_misc/replicant-store';

export default Vue.extend({
  name: 'UndoStopButton',
  computed: {
    isDisabled() {
      return store.state.timer.state !== 'finished';
    },
  },
  methods: {
    button() {
      nodecg.sendMessage('undoStopTimer');
    },
  },
});
</script>
