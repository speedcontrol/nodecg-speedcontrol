<template>
  <v-tooltip
    left
    :disabled="disabled"
  >
    <template v-slot:activator="{ on }">
      <v-btn
        :loading="disabled"
        :disabled="disabled"
        :style="{
          'min-width': 0,
          padding: '0 10px',
          'margin-left': '5px',
        }"
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
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component
export default class extends Vue {
  @Prop({ type: String, default: '' }) readonly icon!: string;
  @Prop({ type: String, default: '' }) readonly tooltip!: string;
  @Prop(Boolean) readonly disabled!: boolean;
}
</script>
