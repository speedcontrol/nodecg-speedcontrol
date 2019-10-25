interface RunDataOption {
  name: string;
  key: string;
  predict: string[];
  custom?: boolean;
}

export default [
  {
    name: 'Game',
    key: 'game',
    predict: [
      'game',
    ],
  },
  {
    name: 'Game (Twitch)',
    key: 'gameTwitch',
    predict: [
      // none yet
    ],
  },
  {
    name: 'Category',
    key: 'category',
    predict: [
      'category',
    ],
  },
  {
    name: 'System',
    key: 'system',
    predict: [
      'system',
      'platform',
    ],
  },
  {
    name: 'Region',
    key: 'region',
    predict: [
      'region',
    ],
  },
  {
    name: 'Released',
    key: 'release',
    predict: [
      'release',
    ],
  },
  {
    name: 'Player(s)',
    key: 'player',
    predict: [
      'player',
      'runner',
    ],
  },
] as RunDataOption[];
