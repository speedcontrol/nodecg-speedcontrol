import { RunDataPlayer } from './RunDataPlayer';

export interface RunDataTeam {
  name?: string;
  id: string;
  players: RunDataPlayer[];
}
