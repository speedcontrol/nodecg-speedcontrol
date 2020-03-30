"use strict";
/* eslint global-require: off */
var events_1 = require("./util/events");
var nodecg_1 = require("./util/nodecg");
module.exports = function (nodecg) {
    nodecg_1.set(nodecg);
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
