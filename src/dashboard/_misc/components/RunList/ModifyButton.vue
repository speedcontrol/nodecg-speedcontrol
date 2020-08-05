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
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component
export default class extends Vue {
  @Prop({ type: String, default: '' }) readonly icon!: string;
  @Prop({ type: String, default: '' }) readonly tooltip!: string;
  @Prop(Boolean) readonly disabled!: boolean;
}
</script>
