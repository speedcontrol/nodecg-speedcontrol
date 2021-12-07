"use strict";
/* eslint-disable global-require */
// This must go first so we can use module aliases!
/* eslint-disable import/first */
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('module-alias').addAlias('@nodecg-speedcontrol', require('path').join(__dirname, '.'));
const events_1 = require("./util/events");
const nodecg_1 = require("./util/nodecg");
module.exports = (nodecg) => {
    /**
     * Because of how `import`s work, it helps to use `require`s to force
     * things to be loaded *after* the NodeCG context is set.
     */
    (0, nodecg_1.set)(nodecg);
    require('./run-control');
    require('./timer');
    require('./horaro-import');
    require('./oengus-import');
    require('./twitch-api');
    require('./srcom-api');
    require('./ffz-ws');
    return {
        listenFor: events_1.listenFor,
        sendMessage: events_1.sendMessage,
    };
};
