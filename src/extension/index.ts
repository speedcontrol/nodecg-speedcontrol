import { NodeCG } from 'nodecg/types/server'; // eslint-disable-line
import HoraroImport from './horaro-import';
import RunControl from './run-control';
import TimerApp from './timer';

export = (nodecg: NodeCG): void => {
  new RunControl(nodecg);
  new TimerApp(nodecg);
  new HoraroImport(nodecg);
}
