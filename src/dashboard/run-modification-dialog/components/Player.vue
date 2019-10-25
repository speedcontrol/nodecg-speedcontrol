<template>
  <div class="Player d-flex align-center">
    <v-icon class="PlayerHandle">
      mdi-drag-vertical
    </v-icon>
    <text-input
      v-model="playerData.name"
      label="Name"
    ></text-input>
    <text-input
      v-model="playerData.social.twitch"
      label="Twitch"
      left-border
    ></text-input>
    <text-input
      v-model="playerData.country"
      label="Country Code"
      left-border
    ></text-input>
    <modify-button
      :style="{ 'margin-left': '5px' }"
      icon="mdi-account-minus"
      tooltip="Remove Player"
      @click="removePlayer"
    ></modify-button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import store from '../store';
import TextInput from './TextInput.vue';
import ModifyButton from './ModifyButton.vue';

export default Vue.extend({
  name: 'Player',
  components: {
    TextInput,
    ModifyButton,
  },
  props: {
    playerData: {
      type: Object,
      default(): object {
        return {};
      },
    },
  },
  methods: {
    removePlayer(): void {
      store.commit('removePlayer', {
        teamID: this.playerData.teamID,
        id: this.playerData.id,
      });
    },
  },
});
</script>
