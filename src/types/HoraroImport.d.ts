export interface ParsedMarkdown {
  url?: string;
  str?: string;
}

// Some really simple typings for the schedule data.
export interface HoraroSchedule {
  schedule: {
    setup_t: number;
    items: {
      length: string;
      length_t: number;
      scheduled: string;
      scheduled_t: number;
      data: (string | null)[];
      options?: {
        setup?: string;
      };
    }[];
    columns: string[];
  };
}

export interface ImportOptions {
  columns: {
    game: number | null;
    gameTwitch: number | null;
    category: number | null;
    system: number | null;
    region: number | null;
    release: number | null;
    player: number | null;
    externalID: number | null;
    custom: {
      [k: string]: number | null;
    };
  };
  split: 0 | 1;
}

export interface ImportOptionsSanitized {
  columns: {
    game: number;
    gameTwitch: number;
    category: number;
    system: number;
    region: number;
    release: number;
    player: number;
    externalID: number;
    custom: {
      [k: string]: number;
    };
  };
  split: 0 | 1;
}
