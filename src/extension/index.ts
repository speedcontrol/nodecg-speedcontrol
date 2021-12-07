/* eslint-disable global-require */

// This must go first so we can use module aliases!
/* eslint-disable import/first */
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('module-alias').addAlias('@nodecg-speedcontrol', require('path').join(__dirname, '.'));

import { ExtensionReturn } from '@nodecg-speedcontrol/types';
import type { NodeCG } from 'nodecg/types/server';
import { listenFor, sendMessage } from './util/events';
import { set } from './util/nodecg';

export = (nodecg: NodeCG): ExtensionReturn => {
  /**
   * Because of how `import`s work, it helps to use `require`s to force
   * things to be loaded *after* the NodeCG context is set.
   */
  set(nodecg);
  require('./run-control');
  require('./timer');
  require('./horaro-import');
  require('./oengus-import');
  require('./twitch-api');
  require('./srcom-api');
  require('./ffz-ws');

  return {
    listenFor,
    sendMessage,
  };
};
