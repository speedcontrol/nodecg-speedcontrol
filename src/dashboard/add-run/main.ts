import Vue from 'vue';
import * as replicantStore from '../_misc/replicant-store';
import App from './main.vue';

replicantStore.create().then(() => {
  new Vue({
    el: '#App',
    render: h => h(App),
  });
});
