<template>
  <div>
    <div>
      Are you sure you want to remove all runs?
      <br><br>This will also remove the currently active run.
    </div>
    <br>
    <div :style="{ float: 'right' }">
      <v-btn @click="$emit('confirm')">
        OK
      </v-btn>
      <v-btn @click="$emit('dismiss')">
        Cancel
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({});
</script>
