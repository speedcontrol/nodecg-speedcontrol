<template>
  <div>
    <v-tooltip
      top
      :disabled="state === 'stopped'"
    >
      <template v-slot:activator="{ on }">
        <span v-on="on">
          <v-btn
            :disabled="state === 'stopped'"
            @click="button"
          >
            <v-icon>mdi-rewind</v-icon>
          </v-btn>
        </span>
      </template>
      <span>Reset</span>
    </v-tooltip>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { nodecg } from '../../_misc/nodecg';
import { store } from '../../_misc/replicant-store';

export default Vue.extend({
  name: 'ResetButton',
  computed: {
    state(): boolean {
      return store.state.timer.state;
    },
  },
  methods: {
    button(): void {
      nodecg.sendMessage('timerReset').then(() => {
        // successful
      }).catch(() => {
        // error
      });
    },
  },
});
</script>
