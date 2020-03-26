export interface OengusMarathon {
  defaultSetupTime: string;
  startDate: string;
}

export interface OengusSchedule {
  id: number;
  lines: OengusLine[];
}

export interface OengusLine {
  id: number;
  gameName: string | null;
  console: string | null;
  emulated: boolean;
  ratio: string | null;
  categoryName: string | null;
  estimate: string;
  setupTime: string;
  setupBlock: boolean;
  customRun: boolean;
  position: number;
  categoryId: number | null;
  type: OengusRunType;
  runners: OengusUser[];
}

export enum OengusRunType {
  single = 'SINGLE',
  race = 'RACE',
  coop = 'COOP',
  other = 'OTHER'
}

export interface OengusUser {
  id: number;
  username: string;
  usernameJapanese: string | null;
  enabled: boolean;
  roles: OengusRole[];
  twitterName?: string;
  twitchName?: string;
  speedruncomName?: string;
  atLeastOneAccountSynchronized: boolean;
  emailPresentForExistingUser: boolean;
}

export enum OengusRole {
  user = 'ROLE_USER'
}
