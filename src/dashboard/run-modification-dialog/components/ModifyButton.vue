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
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component
export default class extends Vue {
  @Prop({ type: String, default: '' }) icon!: string;
  @Prop({ type: String, default: '' }) tooltip!: string;
}
</script>
