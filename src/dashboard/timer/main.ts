import '@mdi/font/css/materialdesignicons.css';
import Vue from 'vue';
import Vuetify from 'vuetify';
import 'vuetify/dist/vuetify.min.css';
import * as replicantStore from '../_misc/replicant-store';
import App from './main.vue';

Vue.use(Vuetify);

replicantStore.create().then(() => {
  new Vue({
    el: '#App',
    render: h => h(App),
  });
});
