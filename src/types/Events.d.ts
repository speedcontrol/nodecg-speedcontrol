/* eslint-disable max-len */

import { BodyData, NeedleHttpVerbs, NeedleResponse } from 'needle';
import { RunData } from './RunData';
import { Speedruncom } from './Speedruncom';
import { CommercialDuration } from './Twitch';

export interface SendMessageArgsMap {
  // Timer
  timerStart: void;
  timerPause: void;
  timerReset?: boolean;
  timerStop: { id?: string; forfeit?: boolean };
  timerUndo?: string;
  timerEdit: string;

  // Run Control
  changeToNextRun: void;
  changeActiveRun: string;
  modifyRun: { runData: RunData; prevID?: string; updateTwitch?: boolean };
  modifyRelayPlayerID: { runID: string; teamID: string; playerID: string };
  removeRun: string;
  returnToStart: void;
  removeAllRuns: void;

  // Twitch
  twitchCommercialStarted: { duration: CommercialDuration };
  twitchStartCommercial: { duration?: CommercialDuration };
  twitchExternalCommercial: { duration: CommercialDuration };
  twitchStartCommercialTimer: { duration: CommercialDuration };
  twitchUpdateChannelInfo: { status?: string; game?: string };
  twitchAPIRequest: {
    method: NeedleHttpVerbs;
    endpoint: string;
    data?: BodyData;
    newAPI?: boolean
  };

  // Featured Channels
  updateFeaturedChannels: string[];
  repeaterFeaturedChannels: string[];

  // Speedrun.com
  srcomSearchForUserDataMultiple: { type: 'name' | 'srcom' | 'twitch' | 'twitter', val: (string | undefined | null) }[];
}

export interface SendMessageReturnMap {
  // Timer
  timerStart: void;
  timerPause: void;
  timerReset: void;
  timerStop: void;
  timerUndo: void;
  timerEdit: void;

  // Run Control
  changeToNextRun: boolean;
  changeActiveRun: boolean;
  modifyRun: boolean;
  modifyRelayPlayerID: void;
  removeRun: void;
  returnToStart: void;
  removeAllRuns: void;

  // Twitch
  twitchCommercialStarted: void;
  twitchStartCommercial: { duration: CommercialDuration };
  twitchExternalCommercial: void;
  twitchStartCommercialTimer: void;
  twitchUpdateChannelInfo: boolean;
  twitchAPIRequest: NeedleResponse;

  // Featured Channels
  updateFeaturedChannels: void;
  repeaterFeaturedChannels: void;

  // Speedrun.com
  srcomSearchForUserDataMultiple: Speedruncom.UserData | undefined;
}

export type SendMessageAck = HandledSendMessageAck | UnhandledSendMessageAck;

interface HandledSendMessageAck {
  handled: true;
}

interface UnhandledSendMessageAck {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (error: Error | null, data?: any): void;
  handled: false;
}

export type SendMessage = <
  K extends keyof SendMessageArgsMap,
>(
  name: K,
  data?: SendMessageArgsMap[K],
) => Promise<SendMessageReturnMap[K]>;

export type ListenFor = <
  K extends keyof SendMessageArgsMap,
>(
  name: K,
  callback: (data: SendMessageArgsMap[K], ack: SendMessageAck) => void,
) => void;
