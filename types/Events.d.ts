export interface SendMessageArgsMap {
  updateChannelInfo: { status: string; game: string };
  twitchGameSearch: string;
}

export interface SendMessageReturnMap {
  updateChannelInfo: void;
  twitchGameSearch: string;
}

export interface SendMessageAck {
  (error: Error | null, data?: any): void;
}

export type SendMessage = <
  K extends keyof SendMessageArgsMap
>(
  name: K,
  data?: SendMessageArgsMap[K],
) => Promise<SendMessageReturnMap[K]>;
