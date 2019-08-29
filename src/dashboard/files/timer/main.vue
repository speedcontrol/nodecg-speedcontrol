<template>
  <v-app>
    <timer-time></timer-time>
    <div
      id="Controls"
      class="d-flex justify-center"
    >
      <start-button></start-button>
      <reset-button></reset-button>
      <!-- Will not show if more than 1 team -->
      <stop-button
        v-if="teams.length <= 1"
        :info="teams[0]"
      ></stop-button>
      <undo-button
        v-if="teams.length <= 1"
        :info="teams[0]"
      ></undo-button>
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
  </v-app>
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
  #Controls {
    padding-top: 10px;
  }

  #Controls > * {
    flex: 1;
  }

  #Controls > *:not(:first-child) {
    margin-left: 5px;
  }

  #Controls >>> .v-btn {
    min-width: 0;
    width: 100%;
  }

  #Teams {
    padding-top: 10px;
  }
</style>
