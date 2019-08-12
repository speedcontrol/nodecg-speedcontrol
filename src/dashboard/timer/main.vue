<template>
  <div id="App">
    <timer-time></timer-time>
    <start-button></start-button>
    <reset-button></reset-button>
    <!-- Will not show if more than 1 team -->
    <stop-button
      v-if="teams.length <= 1"
      :info="teams[0]"
    ></stop-button>
    <!-- Will not show if more than 1 team -->
    <undo-button
      v-if="teams.length <= 1"
      :info="teams[0]"
    ></undo-button>
    <!-- Will only show if more than 1 team -->
    <div v-if="teams.length > 1">
      <br>
      <team
        v-for="(team, index) in teams"
        :key="team.id"
        :info="team"
        :index="index"
      ></team>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import TimerTime from './components/TimerTime.vue';
import StartButton from './components/StartButton.vue';
import ResetButton from './components/ResetButton.vue';
import StopButton from './components/StopButton.vue';
import UndoButton from './components/UndoButton.vue';
import Team from './components/Team.vue';
import { store } from '../_misc/replicant-store';

export default Vue.extend({
  components: {
    TimerTime,
    StartButton,
    ResetButton,
    StopButton,
    UndoButton,
    Team,
  },
  computed: {
    teams() {
      return (store.state.runDataActiveRun) ? store.state.runDataActiveRun.teams : [];
    },
  },
});
</script>
