import { NodeCG } from 'nodecg/types/server'; // eslint-disable-line
import HoraroImport from './horaro-import';
import RunControl from './run-control';
import TimerApp from './timer';
import * as nodecgApiContext from './util/nodecg-api-context';

export = (nodecg: NodeCG): void => {
  // Store a reference to this NodeCG API context for easy access.
  nodecgApiContext.set(nodecg);

  new RunControl();
  new TimerApp();
  new HoraroImport();
}
