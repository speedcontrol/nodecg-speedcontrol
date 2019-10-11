<template>
  <v-app>
    <div :class="{ disabled: disableChanges }">
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
        <stop-button
          v-if="teams.length <= 1"
          :info="teams[0]"
          forfeit
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
    </div>
    <div
      v-if="disableChanges || tempEnable"
      id="DisableOverride"
    >
      <v-btn
        v-if="disableChanges"
        block
        @click="disableChanges = false; tempEnable = true"
      >
        Enable Changes
      </v-btn>
      <v-btn
        v-if="tempEnable"
        block
        @click="disableChanges = true;"
      >
        Disable Changes
      </v-btn>
      <div>Only use this button if needed.</div>
    </div>
    <!-- Hidden toggle for testing -->
    <!--<v-switch
      v-model="disableChanges"
      inset
      hide-details
    ></v-switch>-->
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
  data() {
    return {
      tempEnable: false,
    };
  },
  computed: {
    activeRun() {
      return store.state.runDataActiveRun;
    },
    teams() {
      return (this.activeRun)
        ? this.activeRun.teams : [];
    },
    disableChanges: {
      get() {
        return store.state.timerChangesDisabled;
      },
      set(value: boolean) {
        store.commit('updateTimerDisabledToggle', { value });
      },
    },
  },
  watch: {
    disableChanges(val) {
      if (val) {
        this.tempEnable = false;
      }
    },
    activeRun() {
      this.tempEnable = false;
    },
  },
});
</script>

<style scoped>
  .disabled {
    pointer-events: none;
    opacity: 0.5;
  }

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

  #DisableOverride {
    padding-top: 10px;
  }
  #DisableOverride > div {
    margin-top: 5px;
    font-style: italic;
  }
</style>
