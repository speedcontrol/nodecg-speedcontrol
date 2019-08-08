<template>
  <div>
    <button @click="playRun">
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

export default Vue.extend({
  props: {
    runData: {
      type: Object,
      default() {
        return {};
      },
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
