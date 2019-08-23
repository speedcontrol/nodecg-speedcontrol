<template>
  <v-btn
    :disabled="state === 'stopped'"
    @click="button"
  >
    <v-icon>mdi-rewind</v-icon>
  </v-btn>
</template>

<script lang="ts">
import Vue from 'vue';
import { nodecg } from '../../_misc/nodecg';
import { store } from '../../_misc/replicant-store';

export default Vue.extend({
  name: 'ResetButton',
  computed: {
    state() {
      return store.state.timer.state;
    },
  },
  methods: {
    button() {
      nodecg.sendMessage('resetTimer').then(() => {
        // successful
      }).catch(() => {
        // error
      });
    },
  },
});
</script>
