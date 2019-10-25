<template>
  <div>
    <div>Are you sure you want to logout from the Twitch integration?</div>
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
