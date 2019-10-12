export interface RunData {
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
  teams: RunDataTeam[];
  customData: {
    [key: string]: string;
  };
  id: string;
  hash?: string;
}

export interface RunDataTeam {
  name?: string;
  id: string;
  players: RunDataPlayer[];
}

export interface RunDataPlayer {
  name: string;
  id: string;
  teamID: string;
  country?: string;
  social: {
    twitch?: string;
  };
}

export type RunDataArray = RunData[];

export type RunDataActiveRun = RunData | null;
