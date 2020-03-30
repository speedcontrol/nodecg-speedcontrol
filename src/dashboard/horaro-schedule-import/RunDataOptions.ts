import i18n from '../_misc/i18n';

interface RunDataOption {
  name: string;
  key: string;
  predict: string[];
  custom?: boolean;
}

export default [
  {
    name: i18n.t('game'),
    key: 'game',
    predict: [
      'game',
    ],
  },
  {
    name: i18n.t('gameTwitch'),
    key: 'gameTwitch',
    predict: [
      // none yet
    ],
  },
  {
    name: i18n.t('category'),
    key: 'category',
    predict: [
      'category',
    ],
  },
  {
    name: i18n.t('system'),
    key: 'system',
    predict: [
      'system',
      'platform',
    ],
  },
  {
    name: i18n.t('region'),
    key: 'region',
    predict: [
      'region',
    ],
  },
  {
    name: i18n.t('released'),
    key: 'release',
    predict: [
      'release',
    ],
  },
  {
    name: i18n.t('players'),
    key: 'player',
    predict: [
      'player',
      'runner',
    ],
  },
  {
    name: i18n.t('externalID'),
    key: 'externalID',
    predict: [
      'id',
    ],
  },
] as RunDataOption[];
