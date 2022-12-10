"use strict";
/* eslint-disable max-len */
Object.defineProperty(exports, "__esModule", { value: true });
exports.twitchCommercialTimer = exports.twitchChannelInfo = exports.twitchAPIData = exports.timerChangesDisabled = exports.timer = exports.runFinishTimes = exports.runDataArray = exports.runDataActiveRunSurrounding = exports.runDataActiveRun = exports.oengusImportStatus = exports.horaroImportStatus = exports.horaroImportSavedOpts = exports.defaultSetupTime = void 0;
const nodecg_1 = require("./nodecg");
/**
 * This is where you can declare all your replicant to import easily into other files,
 * and to make sure they have any correct settings on startup.
 */
exports.defaultSetupTime = nodecg_1.get().Replicant('defaultSetupTime');
exports.horaroImportSavedOpts = nodecg_1.get().Replicant('horaroImportSavedOpts');
exports.horaroImportStatus = nodecg_1.get().Replicant('horaroImportStatus', { persistent: false });
exports.oengusImportStatus = nodecg_1.get().Replicant('oengusImportStatus', { persistent: false });
exports.runDataActiveRun = nodecg_1.get().Replicant('runDataActiveRun');
exports.runDataActiveRunSurrounding = nodecg_1.get().Replicant('runDataActiveRunSurrounding');
exports.runDataArray = nodecg_1.get().Replicant('runDataArray');
exports.runFinishTimes = nodecg_1.get().Replicant('runFinishTimes');
exports.timer = nodecg_1.get().Replicant('timer', { persistenceInterval: 100 });
exports.timerChangesDisabled = nodecg_1.get().Replicant('timerChangesDisabled');
exports.twitchAPIData = nodecg_1.get().Replicant('twitchAPIData');
exports.twitchChannelInfo = nodecg_1.get().Replicant('twitchChannelInfo');
exports.twitchCommercialTimer = nodecg_1.get().Replicant('twitchCommercialTimer');
