<template>
  <div class="Run">
    <span>
      {{ runData.game }}
    </span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    runData: {
      type: Object,
      default() {
        return {};
      },
    },
  },
});
</script>
