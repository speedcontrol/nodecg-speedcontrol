<template>
  <div>
    <div>
      Importing will remove all currently added runs, continue?
      <br><br>The currently active run will not be modified.
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
