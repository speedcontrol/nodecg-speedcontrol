<template>
  <div id="App">
    <div id="RunDataGeneral">
      <generic-text-input
        object-key="game"
        title="Game"
      >
      </generic-text-input>
      <generic-text-input
        object-key="gameTwitch"
        title="Game (Twitch)"
      >
      </generic-text-input>
      <!--
      <input
        ref="Category"
        title="Category"
        placeholder="Category"
        :value="runData.category"
      >
      <input
        ref="Estimate"
        title="Estimate (HH:MM:SS)"
        placeholder="Estimate (HH:MM:SS)"
        :value="runData.estimate"
      >
      <input
        ref="System"
        title="System"
        placeholder="System"
        :value="runData.system"
      >
      <input
        ref="Region"
        title="Region"
        placeholder="Region"
        :value="runData.region"
      >
      <input
        ref="Release"
        title="Released"
        placeholder="Released"
        :value="runData.release"
      >
      <input
        ref="SetupTime"
        title="Setup Time (HH:MM:SS)"
        placeholder="Setup Time (HH:MM:SS)"
        :value="runData.setupTime"
      >-->
    </div>
    <div id="Teams">
      <!--<team
        v-for="team in runData.teams"
        :key="team.id"
        :team="team"
      >
      </team>-->
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import GenericTextInput from './components/GenericTextInput.vue';
import store from './store';

export default Vue.extend({
  components: {
    GenericTextInput,
  },
  computed: {
    game: {
      get() {
        return store.state.runData.game;
      },
      set(value?: string) {
        store.commit('updateRunData', {
          value,
          name: 'game',
        });
      },
    },
  },
});
</script>

<style>
  #RunDataGeneral > input {
    width: 100%;
  }

  #Teams {
    margin-top: 20px;
  }

  .Team:not(:first-child) {
    margin-top: 10px;
  }
</style>
