<template>
  <div class="Player">
    <input
      ref="Name"
      title="Name"
      placeholder="Name"
      :value="player.name"
    >
    <input
      ref="Twitch"
      title="Twitch Username"
      placeholder="Twitch Username"
      :value="player.social.twitch"
    >
    <input
      ref="Country"
      title="Country Code"
      placeholder="Country Code"
      :value="player.country"
    >
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'Player',
  props: {
    player: {
      type: Object,
      default() {
        return {};
      },
    },
  },
});
</script>
