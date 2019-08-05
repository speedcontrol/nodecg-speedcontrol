module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.extension.json',
  },
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
  ],
  rules: {
    '@typescript-eslint/indent': ['error', 2],
    '@typescript-eslint/explicit-member-accessibility': ['off'],
    'no-new': ['off'],
  },
};
