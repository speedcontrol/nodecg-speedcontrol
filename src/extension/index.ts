import { NodeCG } from '../../../../types/server';
import * as nodecgApiContext from './util/nodecg-api-context';

export = (nodecg: NodeCG) => {
  // Store a reference to this NodeCG API context in a place where other libs can easily access it.
  // This must be done before any other files are `require`d.
  nodecgApiContext.set(nodecg);

  // Other extension files we need to load.
  require('./run-data');
  require('./timer');
  require('./horaro-import');
  require('./twitchapi');
  require('./ffzws');
};
