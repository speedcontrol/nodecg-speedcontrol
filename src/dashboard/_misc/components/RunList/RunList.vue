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
    />
    <div v-if="editor && twitchAPIData.state === 'on'">
      <v-checkbox
        v-model="hasNoTwitch"
        class="ma-1 pa-0"
        hide-details
        label="Run has no Twitch game directory listed"
      />
    </div>
    <div
      ref="runList"
      class="RunList"
      :style="{ height: '400px', 'overflow-y': 'scroll' }"
    >
      <v-expansion-panels accordion>
        <draggable
          v-model="runDataArray"
          style="width: 100%"
          handle=".Handle"
          :disabled="searchTerm || hasNoTwitch || !editor"
        >
          <transition-group name="list">
            <run-panel
              v-for="run in filteredRunDataArray"
              :id="`run-${run.id}`"
              :key="run.id"
              :run-data="run"
              :editor="editor"
              :disable-change="disableChange"
              :move-disabled="!!searchTerm || hasNoTwitch || !editor"
            />
          </transition-group>
        </draggable>
      </v-expansion-panels>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Draggable from 'vuedraggable';
import RunPanel from './RunPanel.vue';
import { store } from '../../replicant-store';
import { RunData, RunDataArray, RunDataActiveRun } from '../../../../../types';
import { TwitchAPIData } from '../../../../../schemas';

export default Vue.extend({
  components: {
    Draggable,
    RunPanel,
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
      hasNoTwitch: false,
    };
  },
  computed: {
    runDataArray: {
      get(): RunDataArray {
        return store.state.runDataArray;
      },
      set(value: RunData[]): void {
        store.commit('updateRunOrder', { value });
      },
    },
    filteredRunDataArray(): RunData[] {
      return store.state.runDataArray.filter((run) => {
        const str = (this.searchTerm) ? this.searchTerm.toLowerCase() : '';
        const searchMatch = !str || (str && ((run.game && run.game.toLowerCase().includes(str))
          || !!run.teams.find((team) => (team.name && team.name.toLowerCase().includes(str))
          || !!team.players.find((player) => player.name.toLowerCase().includes(str)))));
        return searchMatch && ((this.hasNoTwitch && !run.gameTwitch) || (!this.hasNoTwitch));
      });
    },
    activeRun(): RunDataActiveRun {
      return store.state.runDataActiveRun;
    },
    disableChange(): boolean {
      return ['running', 'paused'].includes(store.state.timer.state);
    },
    twitchAPIData(): TwitchAPIData {
      return store.state.twitchAPIData;
    },
  },
  watch: {
    activeRun(val): void {
      if (!this.editor) {
        this.scroll(val);
      }
    },
  },
  mounted() {
    // Cannot be done with "immediate: true" on watcher
    // due to element not being mounted at that point.
    if (!this.editor) {
      this.scroll(this.activeRun);
    }
  },
  methods: {
    scroll(val): void {
      if (val) {
        this.$vuetify.goTo(`#run-${val.id}`, { offset: 25, container: '.RunList' });
      } else {
        this.$vuetify.goTo(0, { container: '.RunList' });
      }
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
</style>
