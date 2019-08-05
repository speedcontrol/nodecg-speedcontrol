<template>
  <input
    v-model="inputText"
    :title="title"
    :placeholder="title"
  >
</template>

<script lang="ts">
import Vue from 'vue';
import store from '../store';
import { RunData } from '../../../../types';

interface RunDataModified extends RunData {
  [key: string]: any;
}

export default Vue.extend({
  props: {
    objectKey: {
      type: String,
      default: 'game',
    },
    title: {
      type: String,
      default: 'Game',
    },
  },
  computed: {
    inputText: {
      get() {
        const runData = store.state.runData as RunDataModified;
        return runData[this.objectKey];
      },
      set(value: string | undefined) {
        store.commit('updateRunData', {
          value,
          name: this.objectKey,
        });
      },
    },
  },
});
</script>
