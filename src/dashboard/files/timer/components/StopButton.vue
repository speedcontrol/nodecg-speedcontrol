<template>
  <div>
    <v-tooltip
      top
      :disabled="isDisabled"
    >
      <template v-slot:activator="{ on }">
        <span v-on="on">
          <v-btn
            :disabled="isDisabled"
            @click="button"
          >
            <v-icon v-if="forfeit">mdi-close</v-icon>
            <v-icon v-else>mdi-check</v-icon>
          </v-btn>
        </span>
      </template>
      <span v-if="forfeit">Forfeit</span>
      <span v-else>Stop</span>
    </v-tooltip>
  </div>
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
    forfeit: {
      type: Boolean,
      default: false,
    },
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
      nodecg.sendMessage('timerStop', {
        id: this.info.id,
        forfeit: this.forfeit,
      }).then(() => {
        // successful
      }).catch(() => {
        // error
      });
    },
  },
});
</script>
