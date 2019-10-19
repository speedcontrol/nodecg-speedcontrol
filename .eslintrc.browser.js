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
    'vue/html-self-closing': ['error', {
      html: {
        component: 'never', // Transpiler(?) has issues with self closing components.
      },
    }],
    'max-len': ["error", { "code": 100 }],
    // I legit think the 5 things below are broken, might be a typescript-eslint issue.
    'vue/no-parsing-error': 'off',
    'vue/valid-v-on': 'off',
    'vue/valid-v-if': 'off',
    'vue/valid-v-bind': 'off',
    'vue/valid-v-model': 'off',
  }
};
