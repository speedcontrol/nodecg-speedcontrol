<template>
  <div id="App">
    <timer-time></timer-time>
    <div id="Controls">
      <start-button></start-button>
      <reset-button></reset-button>
      <!-- Will not show if more than 1 team -->
      <span v-if="teams.length <= 1">
        <stop-button
          :info="teams[0]"
        ></stop-button>
        <undo-button
          :info="teams[0]"
        ></undo-button>
      </span>
    </div>
    <!-- Will only show if more than 1 team -->
    <div
      v-if="teams.length > 1"
      id="Teams"
    >
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
      return (store.state.runDataActiveRun)
        ? store.state.runDataActiveRun.teams : [];
    },
  },
});
</script>

<style scoped>
  .v-btn.v-size--default {
    padding: 0 5px;
    min-width: 0;
  }

  #Controls {
    width: 100%;
    display: flex;
    justify-content: center;
    padding-top: 10px;
  }

  #Controls .v-btn {
    flex-basis: 0;
    flex: 1 1 0;
  }

  #Controls .v-btn:not(:first-child) {
    margin-left: 5px;
  }

  #Teams {
    padding-top: 10px;
  }
</style>
