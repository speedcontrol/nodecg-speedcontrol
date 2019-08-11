<template>
  <div id="App">
    <component
      :is="currentComponent"
      @confirm="close(true)"
      @dismiss="close(false)"
    ></component>
  </div>
</template>

<script lang="ts">
import Vue, { VueConstructor } from 'vue';
import HoraroImportConfirm from './components/horaro-import-confirm.vue';
import ReturnToStartConfirm from './components/return-to-start-confirm.vue';
import { nodecg } from '../_misc/nodecg';

export default Vue.extend({
  data() {
    return {
      dialog: undefined as any,
      currentComponent: undefined as VueConstructor | undefined,
      callbackFunc: undefined as Function | undefined,
    };
  },
  mounted() {
    this.dialog = nodecg.getDialog('alert') as any;

    // Attaching this function to the window for easy access from dashboard panels.
    (window as any).open = (opts: { name: string; func: Function; }) => this.open(opts);

    // Small hack to make the NodeCG dialog look a little better for us, not perfect yet.
    const elem = this.dialog.getElementsByTagName('paper-dialog-scrollable')[0] as HTMLElement;
    elem.style.marginBottom = '12px';
  },
  methods: {
    open(opts: { name: string; func?: Function; }) {
      this.currentComponent = ((name) => {
        switch (name) {
          case 'HoraroImportConfirm':
            return HoraroImportConfirm;
          case 'ReturnToStartConfirm':
            return ReturnToStartConfirm;
          default:
            return undefined;
        }
      })(opts.name);
      this.callbackFunc = opts.func;
      this.dialog.open();
    },
    close(confirm: boolean) {
      // Trigger callback function passed earlier if set.
      if (this.callbackFunc) {
        this.callbackFunc(confirm);
      }
      this.dialog._updateClosingReasonConfirmed(confirm); // eslint-disable-line
      this.dialog.close();
      this.callbackFunc = undefined;
      this.currentComponent = undefined;
    },
  },
});
</script>
