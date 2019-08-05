import { NodeCG } from 'nodecg/types/server'; // eslint-disable-line
import TimerApp from './timer';
import * as nodecgApiContext from './util/nodecg-api-context';

export = (nodecg: NodeCG): void => {
  // Store a reference to this NodeCG API context for easy access.
  nodecgApiContext.set(nodecg);

  new TimerApp();
};
