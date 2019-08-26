<template>
  <v-expansion-panel
    :class="{'grey lighten-2': activeRun && activeRun.id === runData.id}"
  >
    <v-expansion-panel-header>{{ runData.game }}</v-expansion-panel-header>
    <v-expansion-panel-content>
      Category: {{ runData.category }}
      <br>Estimate: {{ runData.estimate }}
      <br>System: {{ runData.system }}
      <br><br><v-btn
        icon
        outlined
        :disabled="disableChange"
        @click="playRun"
      >
        <v-icon>mdi-play</v-icon>
      </v-btn>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script lang="ts">
import Vue from 'vue';
import { nodecg } from '../../_misc/nodecg';
import { store } from '../../_misc/replicant-store';

export default Vue.extend({
  props: {
    runData: {
      type: Object,
      default() {
        return {};
      },
    },
  },
  computed: {
    disableChange() {
      return ['running', 'paused'].includes(store.state.timer.state);
    },
    activeRun() {
      return store.state.runDataActiveRun;
    },
  },
  methods: {
    playRun() {
      nodecg.sendMessage('changeActiveRun', this.runData.id).then(() => {
        // run change successful
      }).catch(() => {
        // run change unsuccessful
      });
    },
  },
});
</script>
