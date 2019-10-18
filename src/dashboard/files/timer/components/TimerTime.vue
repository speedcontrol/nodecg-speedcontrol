<template>
  <div>
    <v-tooltip
      bottom
      :disabled="disableEditing"
    >
      <template v-slot:activator="{ on }">
        <span v-on="on">
          <v-text-field
            v-model="time"
            class="TimerInput"
            solo
            single-line
            hide-details
            :background-color="bgColour"
            :readonly="disableEditing"
            @blur="abandonEdit"
            @keyup.enter="finishEdit"
          >
          </v-text-field>
        </span>
      </template>
      <span>Click to edit, Enter to save</span>
    </v-tooltip>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { store } from '../../_misc/replicant-store';

export default Vue.extend({
  name: 'TimerTime',
  data() {
    return {
      time: '00:00:00',
    };
  },
  computed: {
    serverTime(): string {
      return store.state.timer.time;
    },
    bgColour(): string {
      switch (store.state.timer.state) {
        case 'stopped':
        case 'paused':
        default:
          return '#455A64';
        case 'running':
          return '';
        case 'finished':
          return '#388E3C';
      }
    },
    disableEditing(): boolean {
      return ['running', 'finished'].includes(store.state.timer.state);
    },
  },
  watch: {
    serverTime: {
      handler(val): void {
        this.time = val;
      },
      immediate: true,
    },
  },
  methods: {
    finishEdit(event): void {
      if (this.time.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
        nodecg.sendMessage('timerEdit', this.time).then(() => {
          // successful
        }).catch(() => {
          // error
        });
        event.target.blur();
      }
    },
    abandonEdit(): void {
      this.time = this.serverTime;
    },
  },
});
</script>

<style scoped>
  .TimerInput >>> input {
    text-align: center;
    font-size: 25px;
  }
</style>
