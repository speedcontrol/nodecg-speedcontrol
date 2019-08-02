export interface Timer {
  time: string;
  state: "stopped" | "running" | "paused" | "finished";
  milliseconds: number;
  timestamp: number;
  teamFinishTimes: {
    [id: string]: {
      time: string;
      state: "stopped" | "running" | "paused" | "finished";
      milliseconds: number;
      timestamp: number;
    };
  };
}
