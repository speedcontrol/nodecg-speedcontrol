/* eslint-disable max-len */

import type { DefaultSetupTime, HoraroImportSavedOpts, HoraroImportStatus, OengusImportStatus, RunDataActiveRun, RunDataActiveRunSurrounding, RunDataArray, RunFinishTimes, Timer, TimerChangesDisabled, TwitchAPIData, TwitchChannelInfo, TwitchCommercialTimer } from '@nodecg-speedcontrol/types/schemas';
import { get as nodecg } from './nodecg';

/**
 * This is where you can declare all your replicant to import easily into other files,
 * and to make sure they have any correct settings on startup.
 */

export const defaultSetupTime = nodecg().Replicant<DefaultSetupTime>('defaultSetupTime');
export const horaroImportSavedOpts = nodecg().Replicant<HoraroImportSavedOpts>('horaroImportSavedOpts');
export const horaroImportStatus = nodecg().Replicant<HoraroImportStatus>('horaroImportStatus', { persistent: false });
export const oengusImportStatus = nodecg().Replicant<OengusImportStatus>('oengusImportStatus', { persistent: false });
export const runDataActiveRun = nodecg().Replicant<RunDataActiveRun>('runDataActiveRun');
export const runDataActiveRunSurrounding = nodecg().Replicant<RunDataActiveRunSurrounding>('runDataActiveRunSurrounding');
export const runDataArray = nodecg().Replicant<RunDataArray>('runDataArray');
export const runFinishTimes = nodecg().Replicant<RunFinishTimes>('runFinishTimes');
export const timer = nodecg().Replicant<Timer>('timer', { persistenceInterval: 100 });
export const timerChangesDisabled = nodecg().Replicant<TimerChangesDisabled>('timerChangesDisabled');
export const twitchAPIData = nodecg().Replicant<TwitchAPIData>('twitchAPIData');
export const twitchChannelInfo = nodecg().Replicant<TwitchChannelInfo>('twitchChannelInfo');
export const twitchCommercialTimer = nodecg().Replicant<TwitchCommercialTimer>('twitchCommercialTimer');
