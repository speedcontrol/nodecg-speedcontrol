module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.server.json',
  },
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'airbnb-base',
  ],
  rules: {
    '@typescript-eslint/indent': ['error', 2],
    'import/no-unresolved': [2, { ignore: ['nodecg/types/server'] }],
  },
};
