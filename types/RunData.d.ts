import { RunDataTeam } from './RunDataTeam';

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
