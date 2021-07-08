<i18n>
{
  "en": {
    "panelTitle": "Relay Control",
    "noRun": "There is currently no active run available.",
    "noTeams": "The currently active run does not have any teams.",
    "notRelay": "The currently active run is not set as a relay."
  },
  "ja": {
    "panelTitle": "Relay Control",
    "noRun": "There is currently no active run available.",
    "noTeams": "The currently active run does not have any teams.",
    "notRelay": "The currently active run is not set as a relay."
  }
}
</i18n>

<template>
  <v-app>
    <div v-if="!runDataActiveRun">
      {{ $t('noRun') }}
    </div>
    <div v-else-if="!runDataActiveRun.teams.length">
      {{ $t('noTeams') }}
    </div>
    <div v-else-if="!runDataActiveRun.relay">
      {{ $t('notRelay') }}
    </div>
    <div v-else>
      <team
        v-for="(team, i) in runDataActiveRun.teams"
        :key="team.id"
        :class="{ 'mb-4': i < runDataActiveRun.teams.length - 1 }"
        :run="runDataActiveRun"
        :team="team"
        :index="i"
      />
    </div>
  </v-app>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import { RunDataActiveRun } from '@nodecg-speedcontrol/types';
import { replicantNS } from '../_misc/replicant_store';
import Team from './components/Team.vue';

@Component({
  components: {
    Team,
  },
})
export default class extends Vue {
  @replicantNS.State((s) => s.reps.runDataActiveRun) readonly runDataActiveRun!: RunDataActiveRun;

  mounted(): void {
    if (window.frameElement?.parentElement) {
      window.frameElement.parentElement.setAttribute(
        'display-title',
        this.$t('panelTitle') as string,
      );
    }
  }
}
</script>
