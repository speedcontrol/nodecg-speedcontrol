/* eslint-disable max-len */

import type { DefaultSetupTime, HoraroImportSavedOpts, HoraroImportStatus, OengusImportStatus, RunDataActiveRun, RunDataActiveRunSurrounding, RunDataArray, RunFinishTimes, Timer, TimerChangesDisabled, TwitchAPIData, TwitchChannelInfo, TwitchCommercialTimer } from '@nodecg-speedcontrol/types/schemas';
import type NodeCG from '@nodecg/types';
import { get as nodecg } from './nodecg';

/**
 * This is where you can declare all your replicant to import easily into other files,
 * and to make sure they have any correct settings on startup.
 */

export const defaultSetupTime = nodecg().Replicant<DefaultSetupTime>('defaultSetupTime') as unknown as NodeCG.ServerReplicantWithSchemaDefault<DefaultSetupTime>;
export const horaroImportSavedOpts = nodecg().Replicant<HoraroImportSavedOpts>('horaroImportSavedOpts') as unknown as NodeCG.ServerReplicantWithSchemaDefault<HoraroImportSavedOpts>;
export const horaroImportStatus = nodecg().Replicant<HoraroImportStatus>('horaroImportStatus', { persistent: false }) as unknown as NodeCG.ServerReplicantWithSchemaDefault<HoraroImportStatus>;
export const oengusImportStatus = nodecg().Replicant<OengusImportStatus>('oengusImportStatus', { persistent: false }) as unknown as NodeCG.ServerReplicantWithSchemaDefault<OengusImportStatus>;
export const runDataActiveRun = nodecg().Replicant<RunDataActiveRun>('runDataActiveRun') as unknown as NodeCG.ServerReplicant<RunDataActiveRun>;
export const runDataActiveRunSurrounding = nodecg().Replicant<RunDataActiveRunSurrounding>('runDataActiveRunSurrounding') as unknown as NodeCG.ServerReplicantWithSchemaDefault<RunDataActiveRunSurrounding>;
export const runDataArray = nodecg().Replicant<RunDataArray>('runDataArray') as unknown as NodeCG.ServerReplicantWithSchemaDefault<RunDataArray>;
export const runFinishTimes = nodecg().Replicant<RunFinishTimes>('runFinishTimes') as unknown as NodeCG.ServerReplicantWithSchemaDefault<RunFinishTimes>;
export const timer = nodecg().Replicant<Timer>('timer', { persistenceInterval: 100 }) as unknown as NodeCG.ServerReplicantWithSchemaDefault<Timer>;
export const timerChangesDisabled = nodecg().Replicant<TimerChangesDisabled>('timerChangesDisabled') as unknown as NodeCG.ServerReplicantWithSchemaDefault<TimerChangesDisabled>;
export const twitchAPIData = nodecg().Replicant<TwitchAPIData>('twitchAPIData') as unknown as NodeCG.ServerReplicantWithSchemaDefault<TwitchAPIData>;
export const twitchChannelInfo = nodecg().Replicant<TwitchChannelInfo>('twitchChannelInfo') as unknown as NodeCG.ServerReplicantWithSchemaDefault<TwitchChannelInfo>;
export const twitchCommercialTimer = nodecg().Replicant<TwitchCommercialTimer>('twitchCommercialTimer') as unknown as NodeCG.ServerReplicantWithSchemaDefault<TwitchCommercialTimer>;
