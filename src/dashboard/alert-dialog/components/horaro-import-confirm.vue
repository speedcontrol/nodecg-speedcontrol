<template>
  <div>
    <div>
      Importing will remove all currently added runs, continue?
      <br><br>The currently active run will not be modified.
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
