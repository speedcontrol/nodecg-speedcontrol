export interface Timer {
  time: string;
  state: "stopped" | "running" | "paused" | "finished";
  milliseconds: number;
  timestamp: number;
  teamFinishTimes: {
    [id: string]: TeamFinishTime;
  };
}

export interface TeamFinishTime {
  time: string;
  state: "forfeit" | "completed";
  milliseconds: number;
  timestamp: number;
}

export interface RunFinishTimes {
  [id: string]: Timer
}
