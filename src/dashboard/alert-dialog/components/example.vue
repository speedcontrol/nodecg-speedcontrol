<template>
  <div>
    <div>
      Example Text
    </div>
    <br>
    <div class="DialogButtons">
      <v-btn
        @click="confirm"
      >
        OK
      </v-btn>
      <v-btn
        @click="dismiss"
      >
        Cancel
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
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
