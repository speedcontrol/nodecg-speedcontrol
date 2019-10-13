import { NodeCG } from 'nodecg/types/server'; // eslint-disable-line import/no-unresolved

let nodecg: NodeCG;

export function set(ctx: NodeCG): void {
  nodecg = ctx;
}

export function get(): NodeCG {
  return nodecg;
}
