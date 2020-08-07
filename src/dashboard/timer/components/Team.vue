<template>
  <div class="Team d-flex align-center">
    <stop-button
      :info="info"
    />
    <stop-button
      :info="info"
      forfeit
    />
    <undo-button
      :info="info"
    />
    <div class="TeamName">
      <!-- Show team name if it exists -->
      <span v-if="info.name">{{ info.name }}</span>
      <!-- Show player name if only 1 player in team -->
      <span v-else-if="info.players.length === 1">{{ info.players[0].name }}</span>
      <!-- Show all player names if no team name is set -->
      <span v-else>
        <span
          v-for="(player, i) in info.players"
          :key="player.id"
        >
          {{ player.name }}<span
            v-if="i+1 < info.players.length"
          >,</span>
        </span>
      </span>
      <span v-if="finishTime && state === 'completed'">
        [{{ finishTime }}]
      </span>
      <span v-else-if="finishTime && state === 'forfeit'">
        [{{ $t('forfeit') }}]
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { State } from 'vuex-class';
import { Timer } from 'schemas';
import { RunDataTeam } from 'types';
import StopButton from './StopButton.vue';
import UndoButton from './UndoButton.vue';

@Component({
  components: {
    StopButton,
    UndoButton,
  },
})
export default class extends Vue {
  @Prop(Object) readonly info!: RunDataTeam;
  @Prop({ type: Number, default: 0 }) readonly index!: number;
  @State timer!: Timer;

  get state(): string | undefined {
    if (this.timer.teamFinishTimes[this.info.id]) {
      return this.timer.teamFinishTimes[this.info.id].state;
    }
    return undefined;
  }

  get finishTime(): string | undefined {
    if (this.timer.teamFinishTimes[this.info.id]) {
      return this.timer.teamFinishTimes[this.info.id].time;
    }
    return undefined;
  }

  async button(): Promise<void> {
    try {
      await nodecg.sendMessage('timerReset');
    } catch (err) {
      // error
    }
  }
}
</script>

<style scoped>
  .Team {
    padding: 2px 0;
  }

  .Team > *:not(:last-child) {
    margin-right: 4px;
  }

  .Team >>> .v-btn {
    padding: 0 5px;
    min-width: 0;
  }
</style>
