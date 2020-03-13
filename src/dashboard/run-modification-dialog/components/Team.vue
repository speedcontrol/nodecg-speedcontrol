<i18n>
{
  "en": {
    "teamName": "Team Name",
    "removeTeam": "Remove Team",
    "addNewPlayer": "Add New Player"
  }
}
</i18n>

<template>
  <div :style="{ 'margin-top': '20px' }">
    <div class="d-flex align-center">
      <v-icon
        large
        class="TeamHandle"
        :style="{ cursor: 'move' }"
      >
        mdi-drag
      </v-icon>
      <text-input
        v-model="teamData.name"
        :label="$t('teamName')"
      />
      <modify-button
        :style="{ 'margin-left': '5px' }"
        icon="mdi-account-multiple-minus"
        :tooltip="$t('removeTeam')"
        @click="removeTeam"
      />
      <modify-button
        :style="{ 'margin-left': '5px' }"
        icon="mdi-account-plus"
        :tooltip="$t('addNewPlayer')"
        @click="addNewPlayer"
      />
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
        />
      </transition-group>
    </draggable>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Draggable from 'vuedraggable';
import store from '../store';
import Player from './Player.vue';
import TextInput from './TextInput.vue';
import ModifyButton from './ModifyButton.vue';

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
      default(): object {
        return {};
      },
    },
  },
  methods: {
    addNewPlayer(): void {
      store.commit('addNewPlayer', { teamID: this.teamData.id });
    },
    removeTeam(): void {
      store.commit('removeTeam', { teamID: this.teamData.id });
    },
  },
});
</script>
