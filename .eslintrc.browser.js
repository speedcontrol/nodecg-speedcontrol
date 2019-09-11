module.exports = {
  root: true,
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    project: 'tsconfig.browser.json',
    sourceType: 'module',
    extraFileExtensions: ['.vue'],
  },
  env: {
    es6: true,
    node: true,
  },
  globals: {
    nodecg: 'readonly',
    NodeCG: 'readonly',
  },
  plugins: [
    'vue',
    '@typescript-eslint',
  ],
  extends: [
    'airbnb-base',
    'plugin:vue/recommended',
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
    'no-new': ['off'], // Mainly so we can do "new Vue" in the main.ts files, maybe needs excluding there?
    'vue/html-self-closing': ['error', {
      html: {
        component: 'never', // Transpiler(?) has issues with self closing components.
      },
    }],
    'vue/no-parsing-error': 'off', // Due to some issue in typescript-eslint(?), off for now.
    '@typescript-eslint/explicit-function-return-type': 'off', // We *shall* fix this!
    '@typescript-eslint/no-explicit-any': 'off', // We *shall* fix this!
    'no-async-promise-executor': 'off', // We *shall* fix this!
    'vue/valid-v-on': 'off', // We *shall* fix this!
    'vue/valid-v-if': 'off', // We *shall* fix this!
    'vue/valid-v-bind': 'off', // We *shall* fix this!
    'vue/valid-v-model': 'off', // We *shall* fix this!
  }
};
