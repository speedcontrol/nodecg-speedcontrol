<template>
  <div>
    <div>
      Are you sure you want to delete this run?
      <br><br>{{ alertData.runData.game }} - {{ alertData.runData.category }}
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
  props: {
    alertData: {
      type: Object,
      default() {
        return {};
      },
    },
  },
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
