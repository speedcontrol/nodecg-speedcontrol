<template>
  <v-select
    v-model="selected"
    :items="dropdownOpts"
    :label="option.name"
    filled
    single-line
    hide-details
    dense
    :height="27"
  >
  </v-select>
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
  data() {
    return {
      dropdownOpts: [
        {
          value: -1,
          text: 'N/A',
        },
      ],
    };
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
  created() {
    this.dropdownOpts = this.dropdownOpts.concat(
      this.columns.map((value, index) => ({
        value: index,
        text: value,
      })),
    );
  },
});
</script>
