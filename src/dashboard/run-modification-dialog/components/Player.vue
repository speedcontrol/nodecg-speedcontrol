<template>
  <div class="Player">
    <input
      v-model="playerData.name"
      class="Name"
      placeholder="Name"
      title="Name"
    >
    <input
      v-model="playerData.social.twitch"
      class="Twitch"
      placeholder="Twitch"
      title="Twitch"
    >
    <input
      v-model="playerData.country"
      class="Country"
      placeholder="Country Code"
      title="Country Code"
    >
    <button @click="removePlayer">
      Remove
    </button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import store from '../store';

export default Vue.extend({
  name: 'Player',
  props: {
    playerData: {
      type: Object,
      default() {
        return {};
      },
    },
  },
  methods: {
    removePlayer() {
      store.commit('removePlayer', {
        teamID: this.playerData.teamID,
        id: this.playerData.id,
      });
    },
  },
});
</script>

<style scoped>
  .Player {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .Name, .Twitch {
    flex: 1;
  }

  .Country {
    width: 100px;
  }
</style>
