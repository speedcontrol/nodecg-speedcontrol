<template>
  <select
    v-model="selected"
  >
    <option
      :value="null"
      disabled
    >
      Select Column: {{ option.name }}
    </option>
    <option
      :value="-1"
    >
      N/A
    </option>
    <option
      v-for="(colName, index) in columns"
      :key="colName"
      :value="index"
    >
      {{ colName }}
    </option>
  </select>
</template>

<script lang="ts">
import Vue from 'vue';
import store from '../store';

export default Vue.extend({
  props: {
    option: {
      type: Object,
      default() {
        return {
          name: 'Game',
          key: 'game',
          custom: false,
        };
      },
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
        // key must exist in the columns object!
        if ((this as any).option.custom) {
          return (store.state.opts.columns.custom as any)[(this as any).option.key];
        }
        return (store.state.opts.columns as any)[(this as any).option.key];
      },
      set(value: number) {
        store.commit('updateColumn', {
          name: (this as any).option.key,
          value,
          custom: (this as any).option.custom,
        });
      },
    },
  },
});
</script>
