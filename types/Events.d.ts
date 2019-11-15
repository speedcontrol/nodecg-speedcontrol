import { RunData } from "./RunData";

export interface SendMessageArgsMap {
  // Timer
  timerStart: void;
  timerPause: void;
  timerReset?: boolean;
  timerStop: { id?: string; forfeit?: boolean; };
  timerUndo?: string;
  timerEdit: string;

  // Run Control
  changeToNextRun: void;
  changeActiveRun: string;
  modifyRun: { runData: RunData, prevID?: string, updateTwitch?: boolean }
  removeRun: string;
  returnToStart: void;
  removeAllRuns: void;

  // Twitch
  twitchCommercialStarted: { duration: number; }
  twitchStartCommercial: void;
  twitchUpdateChannelInfo: { status?: string, game?: string };

  // Featured Channels
  updateFeaturedChannels: string[];
  repeaterFeaturedChannels: string[];
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
  removeRun: void;
  returnToStart: void;
  removeAllRuns: void;

  // Twitch
  twitchCommercialStarted: void;
  twitchStartCommercial: { duration: number; }
  twitchUpdateChannelInfo: boolean;

  // Featured Channels
  updateFeaturedChannels: void;
  repeaterFeaturedChannels: void;
}

export type SendMessageAck = HandledSendMessageAck | UnhandledSendMessageAck;

interface HandledSendMessageAck {
  handled: true;
}

interface UnhandledSendMessageAck {
  (error: Error | null, data?: any): void;
  handled: false;
}

export type SendMessage = <
  K extends keyof SendMessageArgsMap
>(
  name: K,
  data?: SendMessageArgsMap[K],
) => Promise<SendMessageReturnMap[K]>;

export type ListenFor = <
  K extends keyof SendMessageArgsMap
>(
  name: K,
  callback: (data: SendMessageArgsMap[K], ack: SendMessageAck) => void,
) => void;
