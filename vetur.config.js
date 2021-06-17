module.exports = {
  settings: {
    'vetur.useWorkspaceDependencies': true,
    'vetur.validation.template': false,
  },
  projects: [
    {
      root: './src/dashboard',
      package: '../../package.json',
    }
  ]
}
