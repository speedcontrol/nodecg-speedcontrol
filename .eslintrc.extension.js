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
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
  ],
  settings: {
    'import/core-modules': ['nodecg/types/server'],
    'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
    'import/resolver': {
      node: {
        moduleDirectory: [
          'node_modules',
          '../..',
          '.',
        ],
      },
    },
  },
  rules: {
    'import/extensions': ['error', 'ignorePackages', {
      js: 'never',
      jsx: 'never',
      ts: 'never',
      tsx: 'never',
    }],
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: true, // Some places have dev deps imported where eslint complains.
      packageDir: ['.', '../..'], // Check for deps in NodeCG folder as well.
    }],
    'import/no-unresolved': [2, { caseSensitive: false }],
    'max-len': ['error', { 'code': 100 }],
    'lines-between-class-members': 'off',
    'require-atomic-updates': 'off',
    'no-restricted-syntax': 'off',
    'no-await-in-loop': 'off',
  },
};
