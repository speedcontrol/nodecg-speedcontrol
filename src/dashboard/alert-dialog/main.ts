/* eslint no-new: off, @typescript-eslint/explicit-function-return-type: off */

import Vue from 'vue';
import i18n from '../_misc/i18n';
import vuetify from '../_misc/vuetify';
import App from './main.vue';

new Vue({
  vuetify,
  i18n,
  el: '#App',
  render: (h) => h(App),
});
