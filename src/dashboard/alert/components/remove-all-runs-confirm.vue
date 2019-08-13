<template>
  <div>
    <div>
      Are you sure you want to remove all runs?
      <br><br>This will also remove the currently active run.
    </div>
    <br>
    <div class="DialogButtons">
      <button
        @click="$emit('confirm')"
      >
        OK
      </button>
      <button
        @click="$emit('dismiss')"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({});
</script>

<style scoped>
  .DialogButtons {
    float: right;
  }
</style>
