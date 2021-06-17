/* eslint no-new: off, @typescript-eslint/explicit-function-return-type: off */

import Vue from 'vue';
import i18n from '../_misc/i18n';
import { setUpReplicants } from '../_misc/replicant_store';
import vuetify from '../_misc/vuetify';
import App from './main.vue';
import store from './store';

setUpReplicants(store).then(() => {
  new Vue({
    vuetify,
    i18n,
    store,
    el: '#App',
    render: (h) => h(App),
  });
});
