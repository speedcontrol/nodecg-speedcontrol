<template>
  <div>
    <v-tooltip top>
      <template v-slot:activator="{ on }">
        <v-btn
          icon
          outlined
          @click="$emit('click')"
          v-on="on"
        >
          <v-icon>{{ icon }}</v-icon>
        </v-btn>
      </template>
      <span>{{ tooltip }}</span>
    </v-tooltip>
  </div>
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
