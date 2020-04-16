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
      players: 'Player(s)',
      category: 'Category',
      estimate: 'Estimate',
      system: 'System',
      region: 'Region',
      released: 'Released',
      setupTime: 'Setup Time',
      finalTime: 'Final Time',
      ok: 'OK',
      cancel: 'Cancel',
      notApplicable: 'N/A',
      addNewRun: 'Add New Run',
      duplicateRun: 'Duplicate Run',
      editRun: 'Edit Run',
      forfeit: 'Forfeit',
      externalID: 'External ID',
    },
    ja: {
      game: 'ゲーム',
      gameTwitch: 'Twitchのゲームカテゴリー',
      players: 'プレイヤー',
      category: 'カテゴリー',
      estimate: 'EST',
      system: '機種',
      region: 'リージョン',
      released: 'リリース日',
      setupTime: 'セットアップ時間',
      finalTime: '完走時間',
      ok: 'OK',
      cancel: 'キャンセル',
      notApplicable: 'なし',
      addNewRun: '走者情報の追加',
      duplicateRun: '走者情報の複製',
      editRun: '走者情報の編集',
      forfeit: 'リタイア',
      externalID: '外部ID',
    },
  },
});
