export type RunDataActiveRun = {
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
  teams: {
    name?: string;
    id: number;
    players: {
      name: string;
      id: number;
      teamID: number;
      country?: string;
      social: {
        twitch?: string;
      };
    }[];
  }[];
  customData: {
    [key: string]: string;
  };
  teamLastID: number;
  playerLastID: number;
  id: number;
} | null;
