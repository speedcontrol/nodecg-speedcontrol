<template>
  <v-app>
    <v-btn
      :disabled="!activeRun"
      style="margin-bottom: 10px"
      @click="editActiveRun"
    >
      Edit Currently Active Run
    </v-btn>
    <v-text-field
      v-model="searchTerm"
      filled
      label="Search..."
      append-icon="mdi-magnify"
      :messages="`
        ${filteredRunDataArray.length} run${filteredRunDataArray.length === 1 ? '' : 's'} found.
      `"
    ></v-text-field>
    <div id="RunList">
      <v-expansion-panels
        accordion
      >
        <draggable
          v-model="runDataArray"
          style="width: 100%"
          :disabled="searchTerm"
        >
          <transition-group name="list">
            <run
              v-for="run in filteredRunDataArray"
              :id="`run-${run.id}`"
              :key="run.id"
              :run-data="run"
            ></run>
          </transition-group>
        </draggable>
      </v-expansion-panels>
    </div>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import Run from './components/Run.vue';
import { store } from '../_misc/replicant-store';
import { RunData } from '../../../types';

const Draggable = require('vuedraggable'); // Don't need types now :)

export default Vue.extend({
  components: {
    Draggable,
    Run,
  },
  data() {
    return {
      searchTerm: '',
    };
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
    filteredRunDataArray() {
      return store.state.runDataArray.filter((run) => {
        const str = this.searchTerm.toLowerCase();
        return run.game.toLowerCase().includes(str)
        || !!run.teams.find(team => (team.name && team.name.toLowerCase().includes(str))
        || !!team.players.find(player => player.name.toLowerCase().includes(str)));
      });
    },
    activeRun() {
      return store.state.runDataActiveRun;
    },
  },
  methods: {
    editActiveRun() {
      if (this.activeRun) {
        const runInfoDialog = nodecg.getDialog('run-modification-dialog') as any;
        runInfoDialog.querySelector('iframe').contentWindow.open({
          mode: 'EditActive',
          runData: this.activeRun,
        });
      }
    },
  },
});
</script>

<style scoped>
  #RunList {
    height: 400px;
    overflow-y: scroll;
  }

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
</style>
