<template>
  <select
    v-model="selected"
  >
    <option
      :value="null"
      disabled
    >
      Select Column: {{ name }}
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
    objKey: {
      type: String,
      default: 'game',
    },
    name: {
      type: String,
      default: 'Game',
    },
    custom: {
      type: Boolean,
      default: false,
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
        if ((this as any).custom) {
          return (store.state.opts.columns.custom as any)[(this as any).objKey];
        }
        return (store.state.opts.columns as any)[(this as any).objKey];
      },
      set(value: number) {
        store.commit('updateColumn', {
          name: (this as any).objKey,
          value,
          custom: (this as any).custom,
        });
      },
    },
  },
});
</script>
