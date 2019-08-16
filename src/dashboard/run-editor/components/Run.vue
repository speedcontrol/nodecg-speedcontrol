<template>
  <div class="Run">
    <button @click="editRun">
      Edit
    </button>
    <button @click="removeRunConfirm">
      Remove
    </button>
    <span>
      {{ runData.game }}
    </span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { nodecg } from '../../_misc/nodecg';

export default Vue.extend({
  props: {
    runData: {
      type: Object,
      default() {
        return {};
      },
    },
  },
  methods: {
    editRun() {
      const runInfoDialog = nodecg.getDialog('run-info') as any;
      runInfoDialog.querySelector('iframe').contentWindow.open(this.runData);
    },
    removeRunConfirm() {
      const alertDialog = nodecg.getDialog('alert') as any;
      alertDialog.querySelector('iframe').contentWindow.open({
        name: 'RemoveRunConfirm',
        data: { runData: this.runData },
        func: this.removeRun,
      });
    },
    removeRun(confirm: boolean) {
      if (confirm) {
        nodecg.sendMessage('removeRun', this.runData.id).then(() => {
          // run change successful
        }).catch(() => {
          // run change unsuccessful
        });
      }
    },
  },
});
</script>
