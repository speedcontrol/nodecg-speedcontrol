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
    // We need to do this because dialog-dismissed can be triggered in other ways as well.
    document.addEventListener('dialog-dismissed', () => this.dismiss());
  },
  methods: {
    confirm() {
      // do stuff
      const screwedUp = false;
      if (screwedUp) {
        return; // maybe they screwed something up and we wanna stop them
      }
      this.$emit('confirm');
    },
    dismiss() {
      // do other stuff
    },
  },
});
</script>

<style scoped>
  .DialogButtons {
    float: right;
  }
</style>
