<template>
  <v-app>
    <component
      :is="currentComponent"
      :alert-data="alertData"
      @confirm="close(true)"
      @dismiss="close(false)"
    />
  </v-app>
</template>

<script lang="ts">
import Vue, { VueConstructor } from 'vue';
import HoraroImportConfirm from './components/HoraroImportConfirm.vue';
import ReturnToStartConfirm from './components/ReturnToStartConfirm.vue';
import RemoveAllRunsConfirm from './components/RemoveAllRunsConfirm.vue';
import RemoveRunConfirm from './components/RemoveRunConfirm.vue';
import TwitchLogoutConfirm from './components/TwitchLogoutConfirm.vue';
import NoTwitchGame from './components/NoTwitchGame.vue';
import { nodecg } from '../_misc/nodecg';

export default Vue.extend({
  data() {
    return {
      dialog: undefined as unknown,
      currentComponent: undefined as VueConstructor | undefined,
      alertData: {} as { [k: string ]: unknown },
      callbackFunc: undefined as Function | undefined,
    };
  },
  mounted() {
    this.dialog = nodecg.getDialog('alert-dialog') as any; // eslint-disable-line @typescript-eslint/no-explicit-any, max-len

    // Attaching this function to the window for easy access from dashboard panels.
    (window as unknown).open = (opts: {
      name: string;
      data?: { [k: string ]: unknown };
      func?: Function;
    }): void => this.open(opts);

    // Small hack to make the NodeCG dialog look a little better for us.
    const elem = this.dialog.getElementsByTagName('paper-dialog-scrollable')[0] as HTMLElement;
    elem.style.marginBottom = '12px';

    // Allow alerts to be arbitrarily triggered.
    nodecg.listenFor('triggerAlert', (name) => {
      this.open({ name });
    });
  },
  methods: {
    open(opts: {
      name: string;
      data?: { [k: string ]: unknown };
      func?: Function;
    }): void {
      // Waits for dialog to actually open before doing stuff.
      this.dialog.open();
      document.addEventListener('dialog-opened', () => {
        this.currentComponent = ((name): VueConstructor | undefined => {
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
            case 'NoTwitchGame':
              return NoTwitchGame;
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
    close(confirm: boolean): void {
      // Trigger callback function passed earlier if set.
      if (this.callbackFunc) {
        this.callbackFunc(confirm);
      }
      this.dialog._updateClosingReasonConfirmed(confirm); // eslint-disable-line no-underscore-dangle, max-len
      this.dialog.close();
      this.currentComponent = undefined;
      this.alertData = {};
      this.callbackFunc = undefined;
    },
    confirm(): void {
      // do confirm stuff here
      document.removeEventListener('dialog-dismissed', this.dismiss);
    },
    dismiss(): void {
      // do dismiss stuff here
      document.removeEventListener('dialog-confirmed', this.confirm);
    },
  },
});
</script>
