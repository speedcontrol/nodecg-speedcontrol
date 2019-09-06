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
            <v-icon>mdi-undo</v-icon>
          </v-btn>
        </span>
      </template>
      <span>Undo</span>
    </v-tooltip>
  </div>
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
      nodecg.sendMessage('timerUndo', this.info.id).then(() => {
        // successful
      }).catch(() => {
        // error
      });
    },
  },
});
</script>
