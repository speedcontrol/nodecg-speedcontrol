<template>
  <div>
    <div>
      Are you sure you want to delete this run?
      <br><br>{{ alertData.runData.game }} - {{ alertData.runData.category }}
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

export default Vue.extend({
  props: {
    alertData: {
      type: Object,
      default() {
        return {};
      },
    },
  },
});
</script>

<style scoped>
  .DialogButtons {
    float: right;
  }
</style>
