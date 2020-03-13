import { Configschema } from 'configschema';
import Vue from 'vue';
import VueI18n from 'vue-i18n';

Vue.use(VueI18n);

export default new VueI18n({
  locale: (nodecg.bundleConfig as Configschema).language,
  fallbackLocale: 'en',
  messages: {
    en: {
      game: 'Game',
      gameTwitch: 'Game (Twitch)',
      players: 'Players',
      category: 'Category',
      estimate: 'Estimate',
      system: 'System',
      region: 'Region',
      released: 'Released',
      setupTime: 'Setup Time',
      finalTime: 'Final Time',
      ok: 'OK',
      cancel: 'Cancel',
    },
  },
});
