<template>
  <div class="Team">
    <input
      ref="TeamName"
      title="Team Name"
      placeholder="Team Name"
      :value="team.name"
    >
    <player
      v-for="player in team.players"
      :key="player.id"
      :player="player"
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
    team: {
      type: Object,
      default() {
        return {};
      },
    },
  },
});
</script>
