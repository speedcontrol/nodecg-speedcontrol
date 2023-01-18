import type NodeCG from '@alvancamp/test-nodecg-types';
import { Configschema } from '@nodecg-speedcontrol/types/schemas';

let nodecg: NodeCG.ServerAPI<Configschema>;

export function set(ctx: NodeCG.ServerAPI<Configschema>): void {
  nodecg = ctx;
}

export function get(): NodeCG.ServerAPI<Configschema> {
  return nodecg;
}
