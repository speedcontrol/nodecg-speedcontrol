/**
 * This file does not need to be imported to use nodecg/NodeCG,
 * but seems to at least need to exist for VSCode IntelliSense to work?
 * We also don't use "import type" yet as it seems to break Vetur for Vue SFCs.
 */

import { NodeCGBrowser, NodeCGStaticBrowser } from '../../../../../types/browser';

export const { nodecg, NodeCG }: { nodecg: NodeCGBrowser; NodeCG: NodeCGStaticBrowser } = window;
