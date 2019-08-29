<template>
  <v-tooltip top>
    <template v-slot:activator="{ on }">
      <span v-on="on">
        <v-btn
          icon
          outlined
          @click="$emit('click')"
        >
          <v-icon>{{ icon }}</v-icon>
        </v-btn>
      </span>
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
  },
});
</script>
