<template>
  <div>
    <div>
      The Twitch game directory could not be set correctly,
      it has been set to default. Change this manually if possible.
    </div>
    <br>
    <div :style="{ float: 'right' }">
      <v-btn @click="$emit('dismiss')">
        OK
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({});
</script>
