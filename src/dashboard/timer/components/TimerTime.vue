<template>
  <div>
    <input
      v-if="editing"
      ref="editInput"
      v-model="time"
      @blur="abandonEdit"
      @keyup.enter="finishEdit"
    >
    <div
      v-else
      :class="style"
      @click="startEdit"
    >
      {{ time }}
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { store } from '../../_misc/replicant-store';

export default Vue.extend({
  name: 'TimerTime',
  data() {
    return {
      editing: false,
      time: '00:00:00',
    };
  },
  computed: {
    serverTime() {
      return store.state.timer.time;
    },
    style() {
      return store.state.timer.state;
    },
  },
  watch: {
    serverTime(val) {
      this.time = val;
    },
  },
  created() {
    // For some reason the watcher doesn't get the initial state?
    this.time = this.serverTime;
  },
  methods: {
    startEdit() {
      const { state } = store.state.timer;
      if (state === 'stopped' || state === 'paused') {
        this.editing = true;
        Vue.nextTick().then(() => {
          const input = this.$refs.editInput as HTMLElement;
          input.focus();
        });
      }
    },
    finishEdit() {
      nodecg.sendMessage('editTimer', this.time);
      this.editing = false;
    },
    abandonEdit() {
      this.editing = false;
      this.time = this.serverTime;
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
