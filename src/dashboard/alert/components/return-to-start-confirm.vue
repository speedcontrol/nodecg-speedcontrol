<template>
  <div>
    <div>
      Are you sure you want to return to the start?
    </div>
    <br>
    <div class="DialogButtons">
      <button
        @click="confirm"
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
  mounted() {
  },
  methods: {
    confirm() {
      this.$emit('confirm');
    },
  },
});
</script>

<style scoped>
  .DialogButtons {
    float: right;
  }
</style>
