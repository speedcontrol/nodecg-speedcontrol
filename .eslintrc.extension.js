/**
 * Some stuff is commented out that may need re-enabling if necessary.
 */

module.exports = {
  root: true,
  env: {
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.extension.json',
  },
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'airbnb-typescript/base',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        // This is needed to properly resolve paths.
        project: 'tsconfig.extension.json',
      },
    },
    'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
  },
  rules: {
    '@typescript-eslint/lines-between-class-members': 'off',
    // max-len set to ignore "import" lines (as they usually get long and messy).
    'max-len': ['error', { code: 100, ignorePattern: '^import\\s.+\\sfrom\\s.+;$' }],
    // I mainly have this off as it ruins auto import sorting in VSCode.
    'object-curly-newline': 'off',
    'import/extensions': ['error', 'ignorePackages', {
      js: 'never',
      jsx: 'never',
      ts: 'never',
      tsx: 'never',
    }],
    // 'import/no-unresolved': [2, { commonjs: true, caseSensitive: false }],

    'require-atomic-updates': 'off',
    'no-restricted-syntax': 'off',
    'no-await-in-loop': 'off',
  },

  // Overrides for types.
  overrides: [{
    files: ['**/*.d.ts'],
    rules: {
      // @typescript-eslint/no-unused-vars does not work with type definitions
      '@typescript-eslint/no-unused-vars': 'off',
      // Sometimes eslint complains about this for types (usually when using namespaces).
      'import/prefer-default-export': 'off',
      // Types are only used for development (usually!) so dev dependencies are fine.
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],

      // 'camelcase': 'off',
    }
  }],
};
