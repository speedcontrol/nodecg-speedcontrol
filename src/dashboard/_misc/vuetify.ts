import '@mdi/font/css/materialdesignicons.css';
import Vue from 'vue';
import Vuetify from 'vuetify/lib';
import './common.css';
import './fonts/roboto.css';

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    dark: true,
  },
});
