import Vue from 'vue';
import * as replicantStore from '../_misc/replicant-store';
import vuetify from '../_misc/vuetify';
import App from './main.vue';

replicantStore.create().then(() => {
  new Vue({
    vuetify,
    el: '#App',
    render: (h) => h(App),
  });
});
