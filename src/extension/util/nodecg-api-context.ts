import { NodeCG } from 'nodecg/types/server'; // eslint-disable-line

let context: NodeCG;

export function get(): NodeCG {
  return context;
}

export function set(ctx: NodeCG): void {
  context = ctx;
}
