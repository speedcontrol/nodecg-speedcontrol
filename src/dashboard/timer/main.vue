<template>
  <div id="App">
    <timer-time></timer-time>
    <start-button></start-button>
    <reset-button></reset-button>
    <stop-button></stop-button>
    <undo-stop-button></undo-stop-button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import TimerTime from './components/Time.vue';
import StartButton from './components/StartButton.vue';
import ResetButton from './components/ResetButton.vue';
import StopButton from './components/StopButton.vue';
import UndoStopButton from './components/UndoStopButton.vue';

export default Vue.extend({
  components: {
    TimerTime,
    StartButton,
    ResetButton,
    StopButton,
    UndoStopButton,
  },
});
</script>
