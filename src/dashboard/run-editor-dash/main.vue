<template>
  <v-app>
    <v-btn
      :disabled="!activeRun"
      style="margin-bottom: 10px"
      @click="editActiveRun"
    >
      Edit Currently Active Run
    </v-btn>
    <run-list :editor="true"></run-list>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import { store } from '../_misc/replicant-store';
import RunList from '../_misc/components/RunList.vue';

export default Vue.extend({
  components: {
    RunList,
  },
  computed: {
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
