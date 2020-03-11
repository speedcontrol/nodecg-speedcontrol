<template>
  <div>
    <div>
      Importing will remove all currently added runs, continue?
      <br><br>The currently active run will not be modified.
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
