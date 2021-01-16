/* eslint global-require: off */

import { NodeCG } from 'nodecg/types/server'; // eslint-disable-line import/no-unresolved
import { ExtensionReturn } from '../../types';
import { listenFor, sendMessage } from './util/events';
import { set } from './util/nodecg';

export = (nodecg: NodeCG): ExtensionReturn => {
  set(nodecg);

  require('./run-control');
  require('./timer');
  require('./horaro-import');
  require('./oengus-import');
  require('./twitch-api');
  require('./srcom-api');
  require('./ffz-ws');
  require('./checklist');

  return {
    listenFor,
    sendMessage,
  };
}
