<i18n>
{
  "en": {
    "name": "Name",
    "twitch": "Twitch",
    "countryCode": "Country Code",
    "removePlayer": "Remove Player"
  },
  "ja": {
    "name": "プレイヤー名",
    "twitch": "Twitch ID",
    "countryCode": "国名コード",
    "removePlayer": "プレイヤーの削除"
  }
}
</i18n>

<template>
  <div class="Player d-flex align-center">
    <v-icon class="PlayerHandle">
      mdi-drag-vertical
    </v-icon>
    <text-input
      v-model="playerData.name"
      :label="$t('name')"
    />
    <text-input
      v-model="playerData.social.twitch"
      :label="$t('twitch')"
      left-border
    />
    <text-input
      v-model="playerData.country"
      :label="$t('countryCode')"
      left-border
    />
    <text-input
      v-for="data in customData"
      :key="data.key"
      v-model="playerData.customData[data.key]"
      :label="data.name"
      left-border
    />
    <modify-button
      :style="{ 'margin-left': '5px' }"
      icon="mdi-account-minus"
      :tooltip="$t('removePlayer')"
      @click="removePlayer({ teamID: playerData.teamID, id: playerData.id })"
    />
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { Mutation } from 'vuex-class';
import { Configschema } from 'configschema';
import { RunDataPlayer } from 'types';
import TextInput from './TextInput.vue';
import ModifyButton from './ModifyButton.vue';
import { RemovePlayer } from '../store';

@Component({
  components: {
    TextInput,
    ModifyButton,
  },
})
export default class extends Vue {
  @Prop({ type: Object, default: {} }) playerData!: RunDataPlayer;
  @Mutation removePlayer!: RemovePlayer;

  get customData(): { name: string, key: string }[] {
    return (nodecg.bundleConfig as Configschema).customData?.player || [];
  }
}
</script>
