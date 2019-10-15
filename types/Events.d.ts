import { UserData } from './Speedruncom';

export interface SendMessageArgsMap {
  twitchUpdateChannelInfo: { status: string; game: string };
  twitchGameSearch: string;
  srcomTwitchGameSearch: { query: string; abbr?: boolean };
  srcomUserSearch: string;
  twitchRefreshToken: void;
  updateFeaturedChannels: string[];
  repeaterFeaturedChannels: string[];
  timerStart: void;
  timerReset?: boolean;
  timerStop: { id?: string; forfeit?: boolean; };
  twitchCommercialStarted: { duration: number; }
}

export interface SendMessageReturnMap {
  twitchUpdateChannelInfo: void;
  twitchGameSearch: string;
  srcomTwitchGameSearch: string;
  srcomUserSearch: UserData;
  twitchRefreshToken: void;
  updateFeaturedChannels: void;
  repeaterFeaturedChannels: void;
  timerStart: void;
  timerReset: void;
  timerStop: void;
  twitchCommercialStarted: void;
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
