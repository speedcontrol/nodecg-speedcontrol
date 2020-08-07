<i18n>
{
  "en": {
    "undo": "Undo"
  },
  "ja": {
    "undo": "元に戻す"
  }
}
</i18n>

<template>
  <div>
    <v-tooltip
      top
      :disabled="isDisabled"
    >
      <template v-slot:activator="{ on }">
        <span v-on="on">
          <v-btn
            :disabled="isDisabled"
            @click="button"
          >
            <v-icon>mdi-undo</v-icon>
          </v-btn>
        </span>
      </template>
      <span>{{ $t('undo') }}</span>
    </v-tooltip>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { State } from 'vuex-class';
import { Timer } from 'schemas';

@Component
export default class extends Vue {
  @Prop({ type: Object, default: { id: undefined } }) readonly info!: { id?: string };
  @State timer!: Timer;

  get isDisabled(): boolean {
    return (
      // If no team information has been supplied.
      !this.info.id && this.timer.state !== 'finished'
    ) || (
      // If team information is supplied, need to check if the team is finished.
      !!this.info.id && (!this.timer.teamFinishTimes[this.info.id as string]
      || !['running', 'finished'].includes(this.timer.state))
    );
  }

  async button(): Promise<void> {
    try {
      await nodecg.sendMessage('timerUndo', this.info.id);
    } catch (err) {
      // catch
    }
  }
}
</script>
