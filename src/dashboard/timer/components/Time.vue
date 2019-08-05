<template>
  <div
    :class="style"
  >
    {{ time }}
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { store } from '../../_misc/replicant-store';

export default Vue.extend({
  name: 'TimerTime',
  computed: {
    time() {
      return store.state.timer.time;
    },
    style() {
      return store.state.timer.state;
    },
  },
});
</script>

<style scoped>
  .stopped  {
    color: grey;
  }

  .running {
    color: blue
  }

  .paused {
    color: orange;
  }

  .finished {
    color: green;
  }
</style>
