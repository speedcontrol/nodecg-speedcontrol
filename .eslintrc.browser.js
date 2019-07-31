module.exports = {
  extends: [
    'airbnb-base',
    'plugin:vue/recommended',
    './.eslintrc.base.js',
  ],
  globals: {
    nodecg: 'readonly',
    NodeCG: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: [
    'vue',
  ],
  rules: {
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'vue/html-self-closing': ['error', { html: { component: 'never' } }],
  },
};
