<template>
  <div>
    <button
      :disabled="disableChange"
      @click="playRun"
    >
      Play
    </button>
    <span>
      {{ runData.game }}
    </span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { nodecg } from '../../_misc/nodecg';
import { store } from '../../_misc/replicant-store';

export default Vue.extend({
  props: {
    runData: {
      type: Object,
      default() {
        return {};
      },
    },
  },
  computed: {
    disableChange() {
      return ['running', 'paused'].includes(store.state.timer.state);
    },
  },
  methods: {
    playRun() {
      nodecg.sendMessage('changeActiveRun', this.runData.id).then(() => {
        // run change successful
      }).catch(() => {
        // run change unsuccessful
      });
    },
  },
});
</script>
