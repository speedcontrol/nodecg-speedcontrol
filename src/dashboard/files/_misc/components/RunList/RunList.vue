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
    <div v-if="editor">
      <v-checkbox
        v-model="hasNoTwitch"
        class="ma-1 pa-0"
        hide-details
        label="Run has no Twitch game directory listed"
      ></v-checkbox>
    </div>
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
            ></run-panel>
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
import { RunData } from '../../../../../../types';

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
        const searchMatch = !str || (str && ((run.game && run.game.toLowerCase().includes(str))
          || !!run.teams.find((team) => (team.name && team.name.toLowerCase().includes(str))
          || !!team.players.find((player) => player.name.toLowerCase().includes(str)))));
        return searchMatch && ((this.hasNoTwitch && !run.gameTwitch) || (!this.hasNoTwitch));
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
