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
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component
export default class extends Vue {
  @Prop({ type: String, default: '' }) value!: string;
  @Prop({ type: String, default: '' }) label!: string;
  @Prop(Boolean) leftBorder!: boolean;
}
</script>

<style scoped>
 .LeftBorder {
   border-left: 1px solid white;
 }
</style>
