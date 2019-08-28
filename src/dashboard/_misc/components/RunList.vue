<template>
  <div>
    <v-text-field
      v-model="searchTerm"
      filled
      clearable
      label="Search..."
      append-icon="mdi-magnify"
      :messages="`
        ${filteredRunDataArray.length} run${filteredRunDataArray.length === 1 ? '' : 's'} found.
      `"
    ></v-text-field>
    <div
      ref="runList"
      class="RunList"
    >
      <v-expansion-panels
        accordion
      >
        <draggable
          v-model="runDataArray"
          style="width: 100%"
          :disabled="searchTerm || !editor"
        >
          <transition-group name="list">
            <run-list-panel
              v-for="run in filteredRunDataArray"
              :id="`run-${run.id}`"
              :key="run.id"
              :run-data="run"
              :editor="editor"
              :disable-change="disableChange"
            ></run-list-panel>
          </transition-group>
        </draggable>
      </v-expansion-panels>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import RunListPanel from './RunListPanel.vue';
import { store } from '../replicant-store';
import { RunData } from '../../../../types';

const Draggable = require('vuedraggable'); // Don't need types now :)

export default Vue.extend({
  components: {
    Draggable,
    RunListPanel,
  },
  props: {
    editor: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      searchTerm: null,
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
        const str = (this.searchTerm) ? this.searchTerm.toLowerCase() : '';
        return run.game.toLowerCase().includes(str)
        || !!run.teams.find(team => (team.name && team.name.toLowerCase().includes(str))
        || !!team.players.find(player => player.name.toLowerCase().includes(str)));
      });
    },
    activeRun() {
      return store.state.runDataActiveRun;
    },
    disableChange() {
      return ['running', 'paused'].includes(store.state.timer.state);
    },
  },
  watch: {
    activeRun(val) {
      if (!this.editor) {
        this.scroll(val);
      }
    },
  },
  mounted() {
    if (!this.editor) {
      this.scroll(this.activeRun);
    }
  },
  methods: {
    scroll(val) {
      if (val) {
        const { top } = this.$refs.runList.getBoundingClientRect();
        this.$vuetify.goTo(`#run-${val.id}`, { offset: top + 20, container: '.RunList' });
      } else {
        this.$vuetify.goTo(0, { container: '.RunList' });
      }
    },
  },
});
</script>

<style scoped>
  .RunList {
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
