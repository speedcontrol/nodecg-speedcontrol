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
  teams: {
    name?: string;
    id: string;
    players: {
      name: string;
      id: string;
      teamID: string;
      country?: string;
      social: {
        twitch?: string;
      };
    }[];
  }[];
  customData: {
    [key: string]: string;
  };
  id: string;
}
