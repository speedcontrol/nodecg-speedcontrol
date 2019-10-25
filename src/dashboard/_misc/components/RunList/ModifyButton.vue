<template>
  <v-tooltip
    right
    :disabled="disabled"
  >
    <template v-slot:activator="{ on }">
      <v-btn
        icon
        outlined
        small
        :disabled="disabled"
        @click="$emit('click')"
        v-on="on"
      >
        <v-icon small>
          {{ icon }}
        </v-icon>
      </v-btn>
    </template>
    <span>{{ tooltip }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'ModifyButton',
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
