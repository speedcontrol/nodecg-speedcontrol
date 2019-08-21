/* eslint-disable @typescript-eslint/no-explicit-any */

import { NodeCG } from 'nodecg/types/server'; // eslint-disable-line
import { ExtensionReturn } from '../../types';
import HoraroImport from './horaro-import';
import RunControl from './run-control';
import TimerApp from './timer';
import TwitchAPI from './twitch-api';
import { sendMessage } from './util/events';

export = (nodecg: NodeCG): ExtensionReturn => {
  new RunControl(nodecg);
  new TimerApp(nodecg);
  new HoraroImport(nodecg);
  new TwitchAPI(nodecg);

  return {
    sendMessage,
  };
}
