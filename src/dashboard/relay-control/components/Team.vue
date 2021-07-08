<template>
  <div>
    <div class="font-weight-bold">{{ team.name || `Team ${index + 1}` }}</div>
    <v-radio-group
      class="mt-0"
      v-model="relayIndex"
      hide-details
    >
      <v-radio
        v-for="(player, i) in team.players"
        :key="player.id"
        :label="player.name"
        :value="i"
      />
    </v-radio-group>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import Draggable from 'vuedraggable';
import { RunData, RunDataTeam } from '@nodecg-speedcontrol/types';

@Component({
  components: {
    Draggable,
  },
})
export default class extends Vue {
  @Prop({ type: Object, required: true }) readonly run!: RunData;
  @Prop({ type: Object, required: true }) readonly team!: RunDataTeam;
  @Prop({ type: Number, required: true }) readonly index!: number;

  get relayIndex(): number {
    return this.team.relayIndex ?? 0;
  }
  set relayIndex(val: number) {
    nodecg.sendMessage(
      'modifyRelayIndex',
      { runID: this.run.id, teamID: this.team.id, relayIndex: val },
    );
  }
}
</script>
