<i18n>
{
  "en": {
    "teamName": "Team Name",
    "removeTeam": "Remove Team",
    "addNewPlayer": "Add New Player"
  },
  "ja": {
    "teamName": "チーム名",
    "removeTeam": "チームの削除",
    "addNewPlayer": "プレイヤーの追加"
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
        @click="removeTeam(teamData.id)"
      />
      <modify-button
        :style="{ 'margin-left': '5px' }"
        icon="mdi-account-plus"
        :tooltip="$t('addNewPlayer')"
        @click="addNewPlayer(teamData.id)"
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
import { Vue, Component, Prop } from 'vue-property-decorator';
import { Mutation } from 'vuex-class';
import Draggable from 'vuedraggable';
import { RunDataTeam } from 'types';
import Player from './Player.vue';
import TextInput from './TextInput.vue';
import ModifyButton from './ModifyButton.vue';
import { AddNewPlayer, RemoveTeam } from '../store';

@Component({
  components: {
    TextInput,
    Player,
    Draggable,
    ModifyButton,
  },
})
export default class extends Vue {
  @Prop({ type: Object, required: true }) teamData!: RunDataTeam;
  @Mutation addNewPlayer!: AddNewPlayer;
  @Mutation removeTeam!: RemoveTeam;
}
</script>
