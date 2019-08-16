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
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

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
    width: 80px;
  }
</style>
