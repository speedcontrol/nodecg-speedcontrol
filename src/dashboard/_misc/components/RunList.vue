<i18n>
{
  "en": {
    "search": "Search...",
    "noTwitchGame": "Run has no Twitch game directory listed",
    "searchResultCount": "1 run found. | {count} runs found."
  },
  "ja": {
    "search": "検索",
    "noTwitchGame": "Twitchゲームカテゴリを設定していない走者情報のみ表示",
    "searchResultCount": "1件の走者情報が見つかりました。 | {count}件の走者情報が見つかりました。"
  }
}
</i18n>

<template>
  <div>
    <v-text-field
      v-model="searchTerm"
      filled
      clearable
      :label="$t('search')"
      append-icon="mdi-magnify"
      :messages="$tc('searchResultCount', filteredRunDataArray.length)"
    />
    <div v-if="editor && twitchAPIData.state === 'on'">
      <v-checkbox
        v-model="hasNoTwitch"
        class="ma-1 pa-0"
        hide-details
        :label="$t('noTwitchGame')"
      />
    </div>
    <div
      ref="runList"
      class="RunList"
      :style="{
        height: '400px',
        'overflow-y': 'scroll',
      }"
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
import { Vue, Component, Watch, Prop } from 'vue-property-decorator';
import { State } from 'vuex-class';
import { State2Way } from 'vuex-class-state2way';
import goTo from 'vuetify/es5/services/goto';
import { RunDataActiveRun, TwitchAPIData, Timer, RunDataArray } from 'schemas';
import { RunData } from 'types';
import Draggable from 'vuedraggable';
import RunPanel from './RunList/RunPanel.vue';

@Component({
  components: {
    Draggable,
    RunPanel,
  },
})
export default class extends Vue {
  @Prop(Boolean) readonly editor!: boolean;
  @State2Way('updateRunOrder', 'runDataArray') runDataArray!: RunDataArray;
  @State('runDataActiveRun') activeRun!: RunDataActiveRun | undefined;
  @State twitchAPIData!: TwitchAPIData;
  @State timer!: Timer;
  searchTerm = '';
  hasNoTwitch = false;

  get filteredRunDataArray(): RunData[] {
    return this.runDataArray.filter((run) => {
      const str = (this.searchTerm) ? this.searchTerm.toLowerCase() : '';
      const searchMatch = !str || (str && ((run.game && run.game.toLowerCase().includes(str))
        || !!run.teams.find((team) => (team.name && team.name.toLowerCase().includes(str))
        || !!team.players.find((player) => player.name.toLowerCase().includes(str)))));
      return searchMatch && ((this.hasNoTwitch && !run.gameTwitch) || (!this.hasNoTwitch));
    });
  }

  get disableChange(): boolean {
    return ['running', 'paused'].includes(this.timer.state);
  }

  @Watch('activeRun')
  onActiveRunChange(val?: RunDataActiveRun): void {
    if (!this.editor) {
      this.scroll(val);
    }
  }

  scroll(val?: RunDataActiveRun): void {
    if (val) {
      goTo(`#run-${val.id}`, { offset: 25, container: '.RunList' });
    } else {
      goTo(0, { container: '.RunList' });
    }
  }

  mounted(): void {
    // Cannot be done with "immediate: true" on watcher
    // due to element not being mounted at that point.
    if (!this.editor) {
      this.scroll(this.activeRun);
    }
  }
}
</script>

<style scoped>
  .list-move {
    transition: transform 0.2s;
  }
  .list-enter, .list-leave-to {
    opacity: 0;
    transition: transform 0.2s, opacity 0.2s;
  }
  .list-leave-active {
    position: absolute;
  }
</style>
