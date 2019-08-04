import Vue from 'vue';
import { createStore } from '../store';
import App from './main.vue';

createStore().then((store) => {
  new Vue({
    el: '#App',
    store,
    render: h => h(App),
  });
});
