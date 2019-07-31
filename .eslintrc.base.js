module.exports = {
  root: true,
  plugins: ['import'],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {},
    },
  },
  rules: {
    'indent': ['error', 2],
    'import/no-extraneous-dependencies': ['off'],
  },
};
