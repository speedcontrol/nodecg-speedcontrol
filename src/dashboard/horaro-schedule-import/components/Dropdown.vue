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
    <template v-slot:prepend-item>
      <v-list-item disabled>
        <v-list-item-content>
          <v-list-item-title>
            {{ option.name }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-divider class="mb-2" />
    </template>
  </v-select>
</template>

<script lang="ts">
import Vue from 'vue';
import store from '../store';

export default Vue.extend({
  props: {
    option: {
      type: Object,
      default(): object {
        return {
          name: 'Game',
          key: 'game',
          custom: false,
        };
      },
    },
    columns: {
      type: Array,
      default(): array {
        return [];
      },
    },
  },
  computed: {
    dropdownOpts(): array {
      return [
        {
          value: -1,
          text: 'N/A',
        },
      ].concat(
        this.columns.map((value, index) => ({
          value: index,
          text: value,
        })),
      );
    },
    selected: {
      get(): number {
        if (this.option.custom) {
          return store.state.opts.columns.custom[this.option.key];
        }
        return store.state.opts.columns[this.option.key];
      },
      set(value: number): void {
        store.commit('updateColumn', {
          name: this.option.key,
          value,
          custom: this.option.custom,
        });
      },
    },
  },
});
</script>
