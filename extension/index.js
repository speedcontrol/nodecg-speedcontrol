"use strict";
/* eslint-disable no-new */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ffz_ws_1 = __importDefault(require("./ffz-ws"));
var horaro_import_1 = __importDefault(require("./horaro-import"));
var run_control_1 = __importDefault(require("./run-control"));
var srcom_api_1 = __importDefault(require("./srcom-api"));
var timer_1 = __importDefault(require("./timer"));
var twitch_api_1 = __importDefault(require("./twitch-api"));
var events_1 = require("./util/events");
module.exports = function (nodecg) {
    new run_control_1.default(nodecg);
    new timer_1.default(nodecg);
    new horaro_import_1.default(nodecg);
    new twitch_api_1.default(nodecg);
    new srcom_api_1.default(nodecg);
    new ffz_ws_1.default(nodecg);
    return {
        sendMessage: events_1.sendMessage,
    };
};
