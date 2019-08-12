<template>
  <button
    :disabled="isDisabled"
    @click="button"
  >
    Undo
  </button>
</template>

<script lang="ts">
import Vue, { PropOptions } from 'vue';
import { nodecg } from '../../_misc/nodecg';
import { store } from '../../_misc/replicant-store';

export default Vue.extend({
  name: 'UndoButton',
  props: {
    info: {
      type: Object,
      default() {
        return {
          id: undefined,
        };
      },
    } as PropOptions<{ id: string | undefined }>,
  },
  computed: {
    isDisabled(): boolean {
      return (
        // If no team information has been supplied.
        !this.info.id && store.state.timer.state !== 'finished'
      ) || (
        // If team information is supplied, need to check if the team is finished.
        !!this.info.id && (!store.state.timer.teamFinishTimes[this.info.id as string]
        || !['running', 'finished'].includes(store.state.timer.state))
      );
    },
  },
  methods: {
    button() {
      nodecg.sendMessage('undoTimer', this.info.id);
    },
  },
});
</script>
