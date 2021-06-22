import i18n from '../_misc/i18n';

interface RunDataOption {
  name: string;
  key: string;
  predict: string[];
  custom?: boolean;
}

const options: RunDataOption[] = [
  {
    name: i18n.t('game') as string,
    key: 'game',
    predict: [
      'game',
    ],
  },
  {
    name: i18n.t('gameTwitch') as string,
    key: 'gameTwitch',
    predict: [
      // none yet
    ],
  },
  {
    name: i18n.t('category') as string,
    key: 'category',
    predict: [
      'category',
    ],
  },
  {
    name: i18n.t('system') as string,
    key: 'system',
    predict: [
      'system',
      'platform',
      'console',
    ],
  },
  {
    name: i18n.t('region') as string,
    key: 'region',
    predict: [
      'region',
    ],
  },
  {
    name: i18n.t('released') as string,
    key: 'release',
    predict: [
      'release',
    ],
  },
  {
    name: i18n.t('players') as string,
    key: 'player',
    predict: [
      'player',
      'runner',
    ],
  },
  {
    name: i18n.t('externalID') as string,
    key: 'externalID',
    predict: [
      'id',
    ],
  },
];

export default options;
