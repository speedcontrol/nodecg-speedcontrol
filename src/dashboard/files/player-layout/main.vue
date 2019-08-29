<template>
  <v-app>
    This order is only temporary, it does not modify the permenant copy.
    <div v-if="!teams.length">
      <br>No Teams/Run Available
    </div>
    <draggable
      v-else
      v-model="teams"
    >
      <transition-group name="list">
        <v-card
          v-for="(team) in teams"
          :key="team.id"
          class="Team"
        >
          <span v-if="team.name">{{ team.name }}</span>
          <span
            v-for="(player, i) in team.players"
            v-else
            :key="player.id"
          >
            {{ player.name }}<span v-if="i+1 < team.players.length">,</span>
          </span>
        </v-card>
      </transition-group>
    </draggable>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import { store } from '../_misc/replicant-store';
import { RunDataTeam } from '../../../../types';

const Draggable = require('vuedraggable'); // Don't need types now :)

export default Vue.extend({
  components: {
    Draggable,
  },
  computed: {
    teams: {
      get() {
        return (store.state.runDataActiveRun) ? store.state.runDataActiveRun.teams : [];
      },
      set(value: RunDataTeam[]) {
        store.commit('updateActiveRunTeamOrder', {
          value,
        });
      },
    },
  },
});
</script>

<style scoped>
  .list-move {
    transition: transform 0.2s;
  }
  .list-enter, .list-leave-to
  /* .logo-list-complete-leave-active below version 2.1.8 */ {
    opacity: 0;
    transition: transform 0.2s;
    transition: opacity 0.2s;
  }
  .list-leave-active {
    position: absolute;
  }

  .Team {
    text-align: center;
    padding: 5px;
    margin-top: 10px;
  }
</style>
