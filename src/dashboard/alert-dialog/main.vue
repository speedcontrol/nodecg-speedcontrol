<template>
  <div id="App">
    <component
      :is="currentComponent"
      :alert-data="alertData"
      @confirm="close(true)"
      @dismiss="close(false)"
    ></component>
  </div>
</template>

<script lang="ts">
import Vue, { VueConstructor } from 'vue';
import HoraroImportConfirm from './components/horaro-import-confirm.vue';
import ReturnToStartConfirm from './components/return-to-start-confirm.vue';
import RemoveAllRunsConfirm from './components/remove-all-runs-confirm.vue';
import RemoveRunConfirm from './components/remove-run-confirm.vue';
import TwitchLogoutConfirm from './components/twitch-logout-confirm.vue';
import { nodecg } from '../_misc/nodecg';

export default Vue.extend({
  data() {
    return {
      dialog: undefined as any,
      currentComponent: undefined as VueConstructor | undefined,
      alertData: {} as { [k: string ]: any },
      callbackFunc: undefined as Function | undefined,
    };
  },
  mounted() {
    this.dialog = nodecg.getDialog('alert-dialog') as any;

    // Attaching this function to the window for easy access from dashboard panels.
    (window as any).open = (opts: {
      name: string;
      data?: { [k: string ]: any };
      func?: Function;
    }) => this.open(opts);

    // Small hack to make the NodeCG dialog look a little better for us, not perfect yet.
    const elem = this.dialog.getElementsByTagName('paper-dialog-scrollable')[0] as HTMLElement;
    elem.style.marginBottom = '12px';
  },
  methods: {
    open(opts: {
      name: string;
      data?: { [k: string ]: any };
      func?: Function;
    }) {
      // Waits for dialog to actually open before doing stuff.
      this.dialog.open();
      document.addEventListener('dialog-opened', () => {
        this.currentComponent = ((name) => {
          switch (name) {
            case 'HoraroImportConfirm':
              return HoraroImportConfirm;
            case 'ReturnToStartConfirm':
              return ReturnToStartConfirm;
            case 'RemoveAllRunsConfirm':
              return RemoveAllRunsConfirm;
            case 'RemoveRunConfirm':
              return RemoveRunConfirm;
            case 'TwitchLogoutConfirm':
              return TwitchLogoutConfirm;
            default:
              return undefined;
          }
        })(opts.name);
        this.callbackFunc = opts.func;
        this.alertData = (opts.data) ? opts.data : {};
      }, { once: true });
      document.addEventListener('dialog-confirmed', this.confirm, { once: true });
      document.addEventListener('dialog-dismissed', this.dismiss, { once: true });
    },
    close(confirm: boolean) {
      // Trigger callback function passed earlier if set.
      if (this.callbackFunc) {
        this.callbackFunc(confirm);
      }
      this.dialog._updateClosingReasonConfirmed(confirm); // eslint-disable-line
      this.dialog.close();
      this.currentComponent = undefined;
      this.alertData = {};
      this.callbackFunc = undefined;
    },
    confirm() {
      // do confirm stuff here
      document.removeEventListener('dialog-dismissed', this.dismiss);
    },
    dismiss() {
      // do dismiss stuff here
      document.removeEventListener('dialog-confirmed', this.confirm);
    },
  },
});
</script>
