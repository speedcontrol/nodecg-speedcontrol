export interface RunDataPlayer {
  name: string;
  id: string;
  teamID: string;
  country?: string;
  social: {
    twitch?: string;
  };
}