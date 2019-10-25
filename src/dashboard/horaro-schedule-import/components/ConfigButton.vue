<template>
  <v-tooltip
    left
    :disabled="disabled"
  >
    <template v-slot:activator="{ on }">
      <v-btn
        :loading="disabled"
        :disabled="disabled"
        :style="{ 'min-width': 0, padding: '0 10px', 'margin-left': '5px' }"
        @click="$emit('click')"
        v-on="on"
      >
        <v-icon>{{ icon }}</v-icon>
      </v-btn>
    </template>
    <span>{{ tooltip }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'ConfigButton',
  props: {
    icon: {
      type: String,
      default: '',
    },
    tooltip: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
});
</script>
