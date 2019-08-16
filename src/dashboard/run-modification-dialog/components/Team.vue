<template>
  <div>
    <br>
    <input
      v-model="teamData.name"
      placeholder="Team Name"
      title="Team Name"
    >
    <div class="Buttons">
      <button @click="removeTeam">
        Remove Team
      </button>
      <button @click="addNewPlayer">
        Add New Player
      </button>
    </div>
    <draggable
      v-model="teamData.players"
    >
      <transition-group name="list">
        <player
          v-for="player in teamData.players"
          :key="player.id"
          :player-data="player"
        ></player>
      </transition-group>
    </draggable>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import store from '../store';
import Player from './Player.vue';

const draggable = require('vuedraggable'); // Don't need types now :)

export default Vue.extend({
  name: 'Team',
  components: {
    Player,
    draggable,
  },
  props: {
    teamData: {
      type: Object,
      default() {
        return {};
      },
    },
  },
  methods: {
    addNewPlayer() {
      store.commit('addNewPlayer', { teamID: this.teamData.id });
    },
    removeTeam() {
      store.commit('removeTeam', { teamID: this.teamData.id });
    },
  },
});
</script>

<style scoped>
  .Buttons {
    float: right;
  }

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
</style>
