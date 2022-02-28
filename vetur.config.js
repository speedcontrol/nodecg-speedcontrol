module.exports = {
  settings: {
    'vetur.useWorkspaceDependencies': true,
    'vetur.validation.template': false,
  },
  projects: [
    {
      root: './src/dashboard',
      package: '../../package.json',
    },
    {
      root: './src/graphics',
      package: '../../package.json',
    },
    {
      root: './src/browser_shared',
      package: '../../package.json',
    }
  ]
}
