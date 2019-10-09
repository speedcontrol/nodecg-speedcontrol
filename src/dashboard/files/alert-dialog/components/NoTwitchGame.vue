<template>
  <div>
    <div>
      The Twitch game directory could not be set for this run,
      it has been set to default. Change this manually if possible.
    </div>
    <br>
    <div class="DialogButtons">
      <v-btn
        @click="dismiss"
      >
        OK
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
