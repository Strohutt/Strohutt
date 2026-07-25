export interface Car {
  x: number;
  y: number;
  a: number;
  alive: boolean;
  leader: boolean;
}

export interface Ray {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dist: number;
}

export interface Brain {
  layerSizes: number[];
  weights: number[][][]; // [layer][out][in]
  activations: number[][]; // [layer][neuron]
}

export interface GenHistory {
  gen: number;
  best: number;
  mean: number;
  diversity: number;
}

export interface SimConfig {
  population: number;
  hidden: number[];
  sensorCount: number;
  mutationRate: number;
  mutationStrength: number;
  simSpeed: number;
  paused: boolean;
  mode: string;
}

export interface Frame {
  type: "frame";
  mode: string;
  generation: number;
  alive: number;
  population: number;
  steps: number;
  bestFitness: number;
  leaderFitness: number;
  cars: Car[];
  rays: Ray[];
  brain: Brain;
  history: GenHistory[];
  duelLabels: string[];
  trackVersion: number;
  config: SimConfig;
}

export interface TrackData {
  version: number;
  width: number;
  centerline: number[][];
  walls: number[][]; // [x1,y1,x2,y2]
  checkpoints: number[][];
  start: number[];
  startAngle: number;
  world: number[]; // [w, h]
}

export interface BrainRecord {
  id: string;
  name: string;
  createdAt: number;
  meta: Record<string, unknown>;
}

export type Command =
  | { type: "control"; action: "play" | "pause" | "step" | "reset" }
  | {
      type: "params";
      population?: number;
      hidden?: number[];
      sensorCount?: number;
      mutationRate?: number;
      mutationStrength?: number;
      simSpeed?: number;
    }
  | { type: "track"; centerline: number[][]; width: number }
  | { type: "duel"; brains: string[] }
  | { type: "trainMode" };
