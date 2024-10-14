export interface OengusMarathon {
  defaultSetupTime: string;
  startDate: string;
}

export interface OengusSchedule {
  id: number;
  marathonId: string;
  name: string;
  slug: string;
  published: boolean;
  lines: OengusLine[];
}

export interface OengusLine {
  id: number;
  game: string | null;
  console: string | null;
  emulated: boolean;
  ratio: string | null;
  category: string | null;
  estimate: string;
  setupTime: string;
  setupBlock: boolean;
  setupBlockText: string | null;
  customRun: boolean;
  position: number;
  categoryId: number | null;
  type: OengusRunType;
  runners: OengusLineRunner[];
  customData: string | null;
}

export interface OengusLineRunner {
  runnerName: string;
  profile: OengusUser | null;
}

export enum OengusRunType {
  single = 'SINGLE',
  race = 'RACE',
  coop = 'COOP',
  other = 'OTHER',
}

export interface OengusUser {
  id: number;
  username: string;
  displayName: string;
  enabled: boolean;
  banned: boolean;
  languagesSpoken: string[];
  connections: OengusUserConnections[]; // to be introduced
  pronouns: string[];
  country: string | null;
}

export interface OengusUserConnections {
  id: number;
  platform: 'DISCORD' | 'SPEEDRUNCOM' | 'TWITCH' | 'TWITTER' | 'YOUTUBE';
  username: string;
}

export enum OengusRole {
  user = 'ROLE_USER',
  admin = 'ROLE_ADMIN',
  banned = 'ROLE_BANNED',
  sponsor = 'ROLE_SPONSOR',
}
