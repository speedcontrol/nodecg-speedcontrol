<template>
  <select
    v-model="selected"
  >
    <option
      :value="null"
      disabled
    >
      Select Column: {{ text }}
    </option>
    <option
      :value="-1"
    >
      N/A
    </option>
    <option
      v-for="(name, index) in columns"
      :key="name"
      :value="index"
    >
      {{ name }}
    </option>
  </select>
</template>

<script lang="ts">
import Vue from 'vue';
import store from '../store';

export default Vue.extend({
  props: {
    objKey: {
      type: String,
      default: 'game',
    },
    text: {
      type: String,
      default: 'Game',
    },
    columns: {
      type: Array,
      default() {
        return [];
      },
    },
  },
  computed: {
    selected: {
      // Vetur doesn't think "this" exists in here?
      get(): number {
        // objKey must exist in the columns object!
        return (store.state.opts.columns as any)[(this as any).objKey];
      },
      set(value: number) {
        store.commit('updateColumn', {
          name: (this as any).objKey,
          value,
        });
      },
    },
  },
});
</script>
