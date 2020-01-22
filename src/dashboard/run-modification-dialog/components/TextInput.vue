<template>
  <v-text-field
    :value="value"
    :label="label"
    hide-details
    filled
    :class="{ LeftBorder: leftBorder }"
    @input="$emit('input', $event);"
  />
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TextInput',
  props: {
    value: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
    leftBorder: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style scoped>
 .LeftBorder {
   border-left: 1px solid white;
 }
</style>
