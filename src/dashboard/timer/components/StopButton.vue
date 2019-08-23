<template>
  <v-btn
    :disabled="isDisabled"
    @click="button"
  >
    <v-icon>mdi-check</v-icon>
  </v-btn>
</template>

<script lang="ts">
import Vue, { PropOptions } from 'vue';
import { nodecg } from '../../_misc/nodecg';
import { store } from '../../_misc/replicant-store';

export default Vue.extend({
  name: 'StopButton',
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
        this.info.id && !!store.state.timer.teamFinishTimes[this.info.id as string]
      ) || store.state.timer.state !== 'running';
    },
  },
  methods: {
    button() {
      nodecg.sendMessage('stopTimer', this.info.id).then(() => {
        // successful
      }).catch(() => {
        // error
      });
    },
  },
});
</script>
