export type RunData = {
  game?: string;
  gameTwitch?: string;
  system?: string;
  region?: string;
  release?: string;
  category?: string;
  estimate?: string;
  estimateS?: number;
  setupTime?: string;
  setupTimeS?: number;
  scheduled?: string;
  scheduledS?: number;
  teams: RunDataTeams[];
  customData: {
    [key: string]: string;
  };
  id: number;
} | undefined;

interface RunDataTeams {
  name?: string;
  id: number;
  players: RunDataPlayer[];
}

interface RunDataPlayer {
  name: string;
  id: number;
  teamID: number;
  country?: string;
  social: {
    twitch?: string;
  };
}

interface TimerBasic {
  time: string;
  state: string;
  milliseconds: number;
  timestamp: number;
}

export interface Timer extends TimerBasic {
  teamFinishTimes: {
    [id: number]: TimerBasic;
  };
}

export interface RunFinishTimes {
  [id: number]: string;
}
