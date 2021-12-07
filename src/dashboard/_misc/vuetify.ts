import '@fontsource/roboto/latin.css';
import '@mdi/font/css/materialdesignicons.css';
import Vue from 'vue';
import Vuetify from 'vuetify/lib';
import './common.css';

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    dark: true,
  },
});
