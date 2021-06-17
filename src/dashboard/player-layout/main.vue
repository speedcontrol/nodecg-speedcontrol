<i18n>
{
  "en": {
    "panelTitle": "Player Layout",
    "note": "This order is only temporary, it does not modify the permenant copy.",
    "noneAvailable": "No Teams/Run Available"
  },
  "ja": {
    "panelTitle": "走者レイアウト",
    "note": "この順番は一時的なものであり、永続的にデータを変更するものではありません。",
    "noneAvailable": "ゲーム情報/プレイヤー情報がありません。"
  }
}
</i18n>

<template>
  <v-app>
    <em>{{ $t('note') }}</em>
    <div v-if="!teams.length">
      <br>{{ $t('noneAvailable') }}
    </div>
    <draggable
      v-else
      v-model="teams"
    >
      <transition-group name="list">
        <v-card
          v-for="(team) in teams"
          :key="team.id"
          :style="{ 'text-align': 'center', padding: '5px', 'margin-top': '10px' }"
        >
          <span v-if="team.name">{{ team.name }}</span>
          <span
            v-for="(player, i) in team.players"
            v-else
            :key="player.id"
          >
            {{ player.name }}<span v-if="i+1 < team.players.length">,</span>
          </span>
        </v-card>
      </transition-group>
    </draggable>
  </v-app>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import Draggable from 'vuedraggable';
import { RunDataActiveRun, RunDataTeam } from '@nodecg-speedcontrol/types';
import { replicantNS } from '../_misc/replicant_store';
import { storeModule } from './store';

@Component({
  components: {
    Draggable,
  },
})
export default class extends Vue {
  @replicantNS.State((s) => s.reps.runDataActiveRun) readonly runDataActiveRun!: RunDataActiveRun;

  get teams(): RunDataTeam[] {
    return this.runDataActiveRun?.teams || [];
  }
  set teams(val: RunDataTeam[]) {
    storeModule.updateTeamOrder(val);
  }

  mounted(): void {
    if (window.frameElement?.parentElement) {
      window.frameElement.parentElement.setAttribute(
        'display-title',
        this.$t('panelTitle') as string,
      );
    }
  }
}
</script>

<style scoped>
  .list-move {
    transition: transform 0.2s;
  }
  .list-enter, .list-leave-to {
    opacity: 0;
    transition: transform 0.2s, opacity 0.2s;
  }
  .list-leave-active {
    position: absolute;
  }
</style>
