<i18n>
{
  "en": {
    "name": "Name",
    "twitch": "Twitch",
    "countryCode": "Country Code",
    "removePlayer": "Remove Player",
    "pronouns": "Pronouns"
  },
  "ja": {
    "name": "プレイヤー名",
    "twitch": "Twitch ID",
    "countryCode": "国名コード",
    "removePlayer": "プレイヤーの削除",
    "pronouns": "Pronouns"
  }
}
</i18n>

<template>
  <div class="Player d-flex align-center">
    <v-icon class="PlayerHandle">
      mdi-drag-vertical
    </v-icon>
    <text-input
      :value="playerData.name"
      @input="updatePlayerDataProp('name', $event)"
      :label="$t('name')"
    />
    <text-input
      :value="playerData.social.twitch"
      @input="updatePlayerDataProp('social.twitch', $event)"
      :label="$t('twitch')"
      left-border
    />
    <text-input
      :value="playerData.country"
      @input="updatePlayerDataProp('country', $event)"
      :label="$t('countryCode')"
      left-border
    />
    <text-input
      :value="playerData.pronouns"
      @input="updatePlayerDataProp('pronouns', $event)"
      :label="$t('pronouns')"
      left-border
    />
    <text-input
      v-for="data in customData"
      :key="data.key"
      :value="playerData.customData[data.key]"
      @input="updatePlayerDataProp(`customData.${data.key}`, $event)"
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
import { Configschema } from '@nodecg-speedcontrol/types/schemas';
import { RunDataPlayer } from '@nodecg-speedcontrol/types';
import TextInput from './TextInput.vue';
import ModifyButton from './ModifyButton.vue';
import { storeModule } from '../store';

@Component({
  components: {
    TextInput,
    ModifyButton,
  },
})
export default class extends Vue {
  @Prop({ type: Object, required: true }) playerData!: RunDataPlayer;

  updatePlayerDataProp(key: string, val: string): void {
    if (key.split('.').length > 1) {
      const newVal = {
        ...(this.playerData)[key.split('.')[0] as 'customData' | 'social'],
        [key.replace(`${key.split('.')[0]}.`, '')]: val,
      };
      storeModule.updatePlayerDataProp({
        teamId: this.playerData.teamID, id: this.playerData.id, key: key.split('.')[0], val: newVal,
      });
    } else {
      storeModule.updatePlayerDataProp({
        teamId: this.playerData.teamID, id: this.playerData.id, key, val,
      });
    }
  }

  removePlayer({ teamID, id }: { teamID: string, id: string }): void {
    storeModule.removePlayer({ teamID, id });
  }

  get customData(): { name: string, key: string }[] {
    return (nodecg.bundleConfig as Configschema).customData?.player || [];
  }
}
</script>
