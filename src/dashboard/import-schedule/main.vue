<template>
  <div id="App">
    <button @click="importSchedule">
      Import Schedule
    </button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { nodecg } from '../_misc/nodecg';

export default Vue.extend({
  methods: {
    importSchedule() {
      nodecg.sendMessage('importSchedule');
    },
  },
});
</script>
