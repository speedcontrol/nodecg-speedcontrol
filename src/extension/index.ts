/* eslint-disable no-new */

import { NodeCG } from 'nodecg/types/server'; // eslint-disable-line
import { ExtensionReturn } from '../../types';
import FFZWS from './ffz-ws';
import HoraroImport from './horaro-import';
import RunControl from './run-control';
import SRComAPI from './srcom-api';
import TimerApp from './timer';
import TwitchAPI from './twitch-api';
import { sendMessage } from './util/events';

export = (nodecg: NodeCG): ExtensionReturn => {
  new RunControl(nodecg);
  new TimerApp(nodecg);
  new HoraroImport(nodecg);
  new TwitchAPI(nodecg);
  new SRComAPI(nodecg);
  new FFZWS(nodecg);

  return {
    sendMessage,
  };
}
