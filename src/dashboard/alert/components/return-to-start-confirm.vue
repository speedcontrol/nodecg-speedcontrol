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
        @click="dismiss"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  methods: {
    confirm() {
      this.$emit('confirm');
    },
    dismiss() {
      this.$emit('dismiss');
    },
  },
});
</script>

<style scoped>
  .DialogButtons {
    float: right;
  }
</style>
