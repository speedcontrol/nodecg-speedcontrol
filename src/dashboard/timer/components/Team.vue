<template>
  <div>
    <stop-button
      :info="info"
    ></stop-button>
    <undo-button
      :info="info"
    ></undo-button>
    {{ info.name || `Team ${(index + 1)}` }}
    <span v-if="finishTime">
      [{{ finishTime }}]
    </span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import StopButton from './StopButton.vue';
import UndoButton from './UndoButton.vue';
import { store } from '../../_misc/replicant-store';

export default Vue.extend({
  name: 'Team',
  components: {
    StopButton,
    UndoButton,
  },
  props: {
    info: {
      type: Object,
      default() {
        return {};
      },
    },
    index: {
      type: Number,
      default: 0,
    },
  },
  computed: {
    finishTime(): string | undefined {
      if (store.state.timer.teamFinishTimes[this.info.id]) {
        return store.state.timer.teamFinishTimes[this.info.id].time;
      }
      return undefined;
    },
  },
});
</script>
