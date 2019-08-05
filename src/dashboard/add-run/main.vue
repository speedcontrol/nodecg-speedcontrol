<template>
  <div id="App">
    <button @click="openDialog">
      Add Run
    </button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { nodecg } from '../_misc/nodecg';

export default Vue.extend({
  methods: {
    openDialog() {
      const dialog = nodecg.getDialog('run-info') as any;
      dialog.open();
    },
  },
});
</script>
