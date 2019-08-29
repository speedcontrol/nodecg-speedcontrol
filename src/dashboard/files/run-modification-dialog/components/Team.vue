<template>
  <div class="Team">
    <div class="d-flex align-center">
      <v-icon
        large
        class="TeamHandle"
      >
        mdi-drag
      </v-icon>
      <text-input
        v-model="teamData.name"
        label="Team Name"
      ></text-input>
      <modify-button
        icon="mdi-account-multiple-minus"
        tooltip="Remove Team"
        @click="removeTeam"
      ></modify-button>
      <modify-button
        icon="mdi-account-plus"
        tooltip="Add New Player"
        @click="addNewPlayer"
      ></modify-button>
    </div>
    <draggable
      v-model="teamData.players"
      handle=".PlayerHandle"
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
import TextInput from './TextInput.vue';
import ModifyButton from './ModifyButton.vue';

const Draggable = require('vuedraggable'); // Don't need types now :)

export default Vue.extend({
  name: 'Team',
  components: {
    TextInput,
    Player,
    Draggable,
    ModifyButton,
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
  .Team {
    margin-top: 20px;
  }

  .v-tooltip {
    margin-left: 10px;
  }

  .TeamHandle {
    cursor: move;
  }
</style>
