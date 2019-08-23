<template>
  <div>
    <div>
      Importing will remove all currently added runs, continue?
      <br><br>The currently active run will not be modified.
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
