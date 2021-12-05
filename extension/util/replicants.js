"use strict";
/* eslint-disable max-len */
Object.defineProperty(exports, "__esModule", { value: true });
exports.twitchCommercialTimer = exports.twitchChannelInfo = exports.twitchAPIData = exports.timerChangesDisabled = exports.timer = exports.runFinishTimes = exports.runDataArray = exports.runDataActiveRunSurrounding = exports.runDataActiveRun = exports.oengusImportStatus = exports.horaroImportStatus = exports.horaroImportSavedOpts = exports.defaultSetupTime = void 0;
const nodecg_1 = require("./nodecg");
/**
 * This is where you can declare all your replicant to import easily into other files,
 * and to make sure they have any correct settings on startup.
 */
exports.defaultSetupTime = (0, nodecg_1.get)().Replicant('defaultSetupTime');
exports.horaroImportSavedOpts = (0, nodecg_1.get)().Replicant('horaroImportSavedOpts');
exports.horaroImportStatus = (0, nodecg_1.get)().Replicant('horaroImportStatus', { persistent: false });
exports.oengusImportStatus = (0, nodecg_1.get)().Replicant('oengusImportStatus', { persistent: false });
exports.runDataActiveRun = (0, nodecg_1.get)().Replicant('runDataActiveRun');
exports.runDataActiveRunSurrounding = (0, nodecg_1.get)().Replicant('runDataActiveRunSurrounding');
exports.runDataArray = (0, nodecg_1.get)().Replicant('runDataArray');
exports.runFinishTimes = (0, nodecg_1.get)().Replicant('runFinishTimes');
exports.timer = (0, nodecg_1.get)().Replicant('timer', { persistenceInterval: 100 });
exports.timerChangesDisabled = (0, nodecg_1.get)().Replicant('timerChangesDisabled');
exports.twitchAPIData = (0, nodecg_1.get)().Replicant('twitchAPIData');
exports.twitchChannelInfo = (0, nodecg_1.get)().Replicant('twitchChannelInfo');
exports.twitchCommercialTimer = (0, nodecg_1.get)().Replicant('twitchCommercialTimer');
