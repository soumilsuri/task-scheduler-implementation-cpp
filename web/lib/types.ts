// Shared TypeScript types for the CFS scheduler simulation

export type ProcessNature = 'CPU_BOUND' | 'IO_BOUND';
export type EventType = 'CPU' | 'IO_WAIT' | 'IO_CPU';

export interface ProcessState {
  counter: number;
}

/** Input process definition -- mirrors the C++ Process struct */
export interface Process {
  pid: number;
  vruntime: number;
  cpu_burst_time: number;
  priority: number;
  processState: ProcessState;
  processNature: ProcessNature;
}

/** A snapshot of the process queue at a given simulation step */
export interface QueueSnapshot {
  pid: number;
  vruntime: number;
  cpu_burst_time: number;
  priority: number;
  processNature: ProcessNature;
}

/**
 * A single scheduling event produced by the CFS simulation.
 * Corresponds to one iteration of the main scheduling loop.
 */
export interface ScheduleStep {
  /** Logical simulation time at start of this event */
  time: number;
  /** PID of the process being scheduled */
  pid: number;
  /** Type of work done in this step */
  event: EventType;
  /** Duration of this event in logical time units */
  duration: number;
  /** vruntime of this process before the update */
  vruntimeBefore: number;
  /** vruntime of this process after the update */
  vruntimeAfter: number;
  /** Remaining cpu_burst_time after this step */
  remainingBurst: number;
  /** Priority weight used for vruntime calculation */
  weight: number;
  /** Sorted queue snapshot (by vruntime asc) at the START of this step */
  queueSnapshot: QueueSnapshot[];
}

/** Full simulation output */
export interface ScheduleResult {
  steps: ScheduleStep[];
  /** Final process states keyed by pid */
  finalProcesses: Map<number, Process>;
}

/** Per-process statistics computed after the simulation */
export interface ProcessStats {
  pid: number;
  processNature: ProcessNature;
  priority: number;
  totalCpuTime: number;
  totalIoWaitTime: number;
  totalWallTime: number;
  completionTime: number;
  firstStartTime: number;
  turnaroundTime: number;
  waitingTime: number;
  stepCount: number;
}

/** Aggregated global stats */
export interface GlobalStats {
  totalTime: number;
  processCount: number;
  cpuBoundCount: number;
  ioBoundCount: number;
  avgTurnaround: number;
  avgWaiting: number;
}
