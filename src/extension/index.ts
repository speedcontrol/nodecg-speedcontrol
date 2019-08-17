import { NodeCG } from 'nodecg/types/server'; // eslint-disable-line
import HoraroImport from './horaro-import';
import RunControl from './run-control';
import TimerApp from './timer';
import TwitchAPI from './twitch-api';

export = (nodecg: NodeCG): void => {
  new RunControl(nodecg);
  new TimerApp(nodecg);
  new HoraroImport(nodecg);
  new TwitchAPI(nodecg);
}
