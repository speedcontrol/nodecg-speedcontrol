<template>
  <div id="App">
    <draggable v-model="runDataArray">
      <transition-group name="list">
        <run
          v-for="run in runDataArray"
          :key="run.id"
          :run-data="run"
        ></run>
      </transition-group>
    </draggable>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Run from './components/Run.vue';
import { store } from '../_misc/replicant-store';
import { RunData } from '../../../types';

const draggable = require('vuedraggable'); // Don't need types now :)

export default Vue.extend({
  components: {
    draggable,
    Run,
  },
  computed: {
    runDataArray: {
      get() {
        return store.state.runDataArray;
      },
      set(value: RunData[]) {
        store.commit('updateRunOrder', {
          value,
        });
      },
    },
  },
});
</script>

<style scoped>
  .list-move {
    transition: transform 0.2s;
  }
  .list-enter, .list-leave-to
  /* .logo-list-complete-leave-active below version 2.1.8 */ {
    opacity: 0;
    transition: transform 0.2s;
    transition: opacity 0.2s;
  }
  .list-leave-active {
    position: absolute;
  }

  .Run {
    box-sizing: border-box;
    background-color: rgb(216, 216, 216);
    padding: 5px;
    margin-top: 10px;
  }
</style>
