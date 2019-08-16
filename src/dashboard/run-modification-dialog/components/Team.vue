<template>
  <div>
    <br>
    <input
      v-model="teamData.name"
      placeholder="Team Name"
      title="Team Name"
    >
    <player
      v-for="player in teamData.players"
      :key="player.id"
      :player-data="player"
    ></player>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Player from './Player.vue';

export default Vue.extend({
  name: 'Team',
  components: {
    Player,
  },
  props: {
    teamData: {
      type: Object,
      default() {
        return {};
      },
    },
  },
});
</script>
