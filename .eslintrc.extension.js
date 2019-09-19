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
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
  ],
  rules: {
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: true, // Some places have dev deps imported where eslint complains.
      packageDir: ['.', '../..'], // Check for deps in NodeCG folder as well.
    }],
    'no-async-promise-executor': 'off', // Should try and fix these instead.
    '@typescript-eslint/ban-ts-ignore': 'off', // Fix this stuff in the future hopefully.
    'indent': 'off', // Do I need this? (and one below).
    '@typescript-eslint/indent': ['error', 2], // Do I need this? (and one above).
    'max-len': ["error", { "code": 100 }],
  },
};
