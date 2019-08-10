<template>
  <div id="App">
    <component
      :is="currentComponent"
      @confirm="closeDialog(true)"
      @dismiss="closeDialog(false)"
    ></component>
  </div>
</template>

<script lang="ts">
import Vue, { VueConstructor } from 'vue';
import HoraroImportConfirm from './components/horaro-import-confirm.vue';

export default Vue.extend({
  data() {
    return {
      dialog: {} as any,
      currentComponent: undefined as VueConstructor | undefined,
      callbackFunc: undefined as Function | undefined,
    };
  },
  mounted() {
    this.dialog = nodecg.getDialog('alert');

    // Attaching this function to the window for easy access from dashboard panels.
    (window as any).open = (opts: { name: string; func: Function; }) => this.open(opts);

    // Small hack to make the NodeCG dialog look a little better for us, not perfect yet.
    const elem = this.dialog.getElementsByTagName('paper-dialog-scrollable')[0] as HTMLElement;
    elem.style.marginBottom = '12px';
  },
  methods: {
    open(opts: { name: string; func?: Function; }) {
      if (opts.name === 'HoraroImportConfirm') {
        this.currentComponent = HoraroImportConfirm;
      }
      this.callbackFunc = opts.func;
      this.dialog.open();
    },
    closeDialog(confirm: boolean) {
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
