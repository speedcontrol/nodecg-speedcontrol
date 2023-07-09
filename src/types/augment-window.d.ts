/**
 * This is a modified version of the augment-window.d.ts file included in
 * the NodeCG types, but allows us to automatically receive the configuration types.
 */

import { NodeCGAPIClient } from '@alvancamp/test-nodecg-types/client/api/api.client';
import { Configschema } from './schemas';

declare global {
  let NodeCG: typeof NodeCGAPIClient;
  let nodecg: NodeCGAPIClient<Configschema>;
}
