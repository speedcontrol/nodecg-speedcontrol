import { NodeCG } from 'nodecg/types/server';

export = (nodecg: NodeCG): void => {
  nodecg.log.info('Extension code working!');
};
