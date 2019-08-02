import { NodeCG } from 'nodecg/types/server';

let context: NodeCG;

export function get(): NodeCG {
  return context;
}

export function set(ctx: NodeCG): void {
  context = ctx;
}
