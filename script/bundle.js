const { fork } = require('child_process');

const command = process.env.NODE_ENV === 'production' ? 'build' : 'watch';

fork('./node_modules/parcel-bundler/bin/cli.js', [
  command,
  'src/graphics/*.html',
  '--out-dir',
  'graphics',
  '--public-url',
  '.',
]);

fork('./node_modules/parcel-bundler/bin/cli.js', [
  command,
  'src/dashboard/*.html',
  '--out-dir',
  'dashboard',
  '--public-url',
  '.',
]);
