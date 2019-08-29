import '@mdi/font/css/materialdesignicons.css';
import Vue from 'vue';
import Vuetify from 'vuetify';
import 'vuetify/dist/vuetify.min.css';
import './common.css';

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    dark: true,
  },
});
