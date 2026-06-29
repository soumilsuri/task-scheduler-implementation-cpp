/**
 * TypeScript reimplementation of the C++ CFS (Completely Fair Scheduler).
 *
 * Faithfully mirrors:
 *   - src/cfs.cpp          -- main scheduling loop
 *   - src/cpuBoundProcessExecution.cpp  -- weight formula and vruntime update
 *   - src/ioBoundProcessExecution.cpp   -- IO wait simulation
 *   - src/queueService.cpp -- min-heap ordered by vruntime
 *
 * Key difference from C++ original:
 *   - IO wait is modeled as logical time units (IO_WAIT_TIME = 10) rather
 *     than real wall-clock sleep, so the whole simulation completes instantly.
 *   - All steps are captured upfront and replayed with animation in the UI.
 */

import type {
  Process,
  QueueSnapshot,
  ScheduleResult,
  ScheduleStep,
} from './types';

// Mirrors NICE_0_LOAD constant in both C++ files
const NICE_0_LOAD = 1024;

// Mirrors timeSlice=1 in executeCpuBoundProcess call
const CPU_TIME_SLICE = 1;

// Mirrors ioWaitTime=10 in handleIoBoundProcess call
const IO_WAIT_TIME = 10;

// Safety cap: prevent infinite loops for badly formed input
const MAX_STEPS = 10_000;

/**
 * Computes the priority weight.
 * Mirrors: double weightFunction(int priority) in cpuBoundProcessExecution.cpp
 *   weight = NICE_0_LOAD * 1.25^(-priority)
 */
export function weightFunction(priority: number): number {
  return NICE_0_LOAD * Math.pow(1.25, -priority);
}

// ---------------------------------------------------------------------------
// Min-heap utilities (ordered by vruntime ascending)
// Mirrors std::priority_queue with Compare: a->vruntime > b->vruntime
// ---------------------------------------------------------------------------

function heapPush(heap: Process[], p: Process): void {
  heap.push(p);
  bubbleUp(heap, heap.length - 1);
}

function heapPop(heap: Process[]): Process {
  const top = heap[0];
  const last = heap.pop()!;
  if (heap.length > 0) {
    heap[0] = last;
    siftDown(heap, 0);
  }
  return top;
}


function bubbleUp(heap: Process[], i: number): void {
  while (i > 0) {
    const parent = (i - 1) >> 1;
    if (heap[parent].vruntime <= heap[i].vruntime) break;
    [heap[parent], heap[i]] = [heap[i], heap[parent]];
    i = parent;
  }
}

function siftDown(heap: Process[], i: number): void {
  const n = heap.length;
  while (true) {
    let smallest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    if (left < n && heap[left].vruntime < heap[smallest].vruntime) smallest = left;
    if (right < n && heap[right].vruntime < heap[smallest].vruntime) smallest = right;
    if (smallest === i) break;
    [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
    i = smallest;
  }
}

/** Sorted snapshot of the current queue (ascending vruntime) for UI display */
function takeSnapshot(heap: Process[]): QueueSnapshot[] {
  return [...heap]
    .sort((a, b) => a.vruntime - b.vruntime)
    .map((p) => ({
      pid: p.pid,
      vruntime: p.vruntime,
      cpu_burst_time: p.cpu_burst_time,
      priority: p.priority,
      processNature: p.processNature,
    }));
}

// ---------------------------------------------------------------------------
// CPU-bound process execution
// Mirrors: executeCpuBoundProcess in cpuBoundProcessExecution.cpp
// ---------------------------------------------------------------------------

function executeCpuBound(
  process: Process,
  heap: Process[],
  steps: ScheduleStep[],
  currentTime: number
): number {
  const executedTime = Math.min(CPU_TIME_SLICE, process.cpu_burst_time);
  const weight = weightFunction(process.priority);
  const vruntimeBefore = process.vruntime;
  const queueSnapshot = takeSnapshot(heap);

  // Reduce remaining CPU burst time
  process.cpu_burst_time -= executedTime;

  // Update vruntime: vruntime += (executedTime * NICE_0_LOAD) / weight
  process.vruntime += (executedTime * NICE_0_LOAD) / weight;

  steps.push({
    time: currentTime,
    pid: process.pid,
    event: 'CPU',
    duration: executedTime,
    vruntimeBefore,
    vruntimeAfter: process.vruntime,
    remainingBurst: process.cpu_burst_time,
    weight,
    queueSnapshot,
  });

  // Reinsert if burst time remains
  if (process.cpu_burst_time > 0) {
    heapPush(heap, process);
  }

  return currentTime + executedTime;
}

// ---------------------------------------------------------------------------
// IO-bound process execution
// Mirrors: handleIoBoundProcess in ioBoundProcessExecution.cpp
// ---------------------------------------------------------------------------

function executeIoBound(
  process: Process,
  heap: Process[],
  steps: ScheduleStep[],
  currentTime: number
): number {
  const weight = weightFunction(process.priority);
  let time = currentTime;

  // Step 1: IO_WAIT phase (mirrors std::this_thread::sleep_for)
  {
    const vruntimeBefore = process.vruntime;
    const queueSnapshot = takeSnapshot(heap);

    // vruntime += (ioWaitTime * NICE_0_LOAD) / weight
    process.vruntime += (IO_WAIT_TIME * NICE_0_LOAD) / weight;

    steps.push({
      time,
      pid: process.pid,
      event: 'IO_WAIT',
      duration: IO_WAIT_TIME,
      vruntimeBefore,
      vruntimeAfter: process.vruntime,
      remainingBurst: process.cpu_burst_time,
      weight,
      queueSnapshot,
    });

    time += IO_WAIT_TIME;
  }

  // Step 2: CPU execution after IO completion (1 unit, mirrors executedTime=1)
  {
    const executedTime = 1;
    const vruntimeBefore = process.vruntime;
    const queueSnapshot = takeSnapshot(heap);

    process.cpu_burst_time -= executedTime;
    // vruntime += (executedTime * NICE_0_LOAD) / weight
    process.vruntime += (executedTime * NICE_0_LOAD) / weight;

    steps.push({
      time,
      pid: process.pid,
      event: 'IO_CPU',
      duration: executedTime,
      vruntimeBefore,
      vruntimeAfter: process.vruntime,
      remainingBurst: process.cpu_burst_time,
      weight,
      queueSnapshot,
    });

    time += executedTime;
  }

  // Reinsert if cpu_burst_time > 0
  if (process.cpu_burst_time > 0) {
    heapPush(heap, process);
  }

  return time;
}

// ---------------------------------------------------------------------------
// Main CFS scheduling function
// Mirrors: std::vector<ProcessLog*> cfs::schedule(std::vector<Process*>)
// ---------------------------------------------------------------------------

/**
 * Runs the CFS simulation on a list of processes.
 * Returns all scheduling steps for playback and the final process states.
 *
 * NOTE: Deep-copies all input processes so the original array is not mutated.
 */
export function runCFS(inputProcesses: Process[]): ScheduleResult {
  // Deep copy to avoid mutating caller's data
  const heap: Process[] = inputProcesses.map((p) => ({
    ...p,
    processState: { ...p.processState },
  }));

  // Build min-heap from initial array
  for (let i = Math.floor(heap.length / 2) - 1; i >= 0; i--) {
    siftDown(heap, i);
  }

  const steps: ScheduleStep[] = [];
  let currentTime = 0;
  let iterations = 0;

  while (heap.length > 0 && iterations < MAX_STEPS) {
    iterations++;
    const process = heapPop(heap);

    if (process.processNature === 'CPU_BOUND') {
      currentTime = executeCpuBound(process, heap, steps, currentTime);
    } else {
      currentTime = executeIoBound(process, heap, steps, currentTime);
    }
  }

  // Rebuild final process state map from step data
  const finalProcesses = new Map<number, Process>();
  inputProcesses.forEach((p) => {
    finalProcesses.set(p.pid, { ...p, processState: { ...p.processState } });
  });

  return { steps, finalProcesses };
}

// ---------------------------------------------------------------------------
// Statistics helpers
// ---------------------------------------------------------------------------

export function computeStats(
  processes: Process[],
  steps: ScheduleStep[]
) {
  const statsMap = new Map<
    number,
    {
      pid: number;
      processNature: Process['processNature'];
      priority: number;
      totalCpuTime: number;
      totalIoWaitTime: number;
      firstStart: number;
      lastEnd: number;
      stepCount: number;
    }
  >();

  processes.forEach((p) => {
    statsMap.set(p.pid, {
      pid: p.pid,
      processNature: p.processNature,
      priority: p.priority,
      totalCpuTime: 0,
      totalIoWaitTime: 0,
      firstStart: Infinity,
      lastEnd: 0,
      stepCount: 0,
    });
  });

  steps.forEach((step) => {
    const s = statsMap.get(step.pid);
    if (!s) return;
    s.stepCount++;
    if (step.time < s.firstStart) s.firstStart = step.time;
    const end = step.time + step.duration;
    if (end > s.lastEnd) s.lastEnd = end;

    if (step.event === 'CPU' || step.event === 'IO_CPU') {
      s.totalCpuTime += step.duration;
    } else {
      s.totalIoWaitTime += step.duration;
    }
  });

  const totalTime = steps.length > 0
    ? Math.max(...steps.map((s) => s.time + s.duration))
    : 0;

  const processStats = processes.map((p) => {
    const s = statsMap.get(p.pid)!;
    const firstStart = s.firstStart === Infinity ? 0 : s.firstStart;
    const turnaroundTime = s.lastEnd - firstStart;
    const waitingTime = turnaroundTime - s.totalCpuTime - s.totalIoWaitTime;
    return {
      pid: p.pid,
      processNature: s.processNature,
      priority: s.priority,
      totalCpuTime: s.totalCpuTime,
      totalIoWaitTime: s.totalIoWaitTime,
      totalWallTime: s.totalCpuTime + s.totalIoWaitTime,
      completionTime: s.lastEnd,
      firstStartTime: firstStart,
      turnaroundTime,
      waitingTime: Math.max(0, waitingTime),
      stepCount: s.stepCount,
    };
  });

  const avgTurnaround =
    processStats.reduce((sum, s) => sum + s.turnaroundTime, 0) /
    (processStats.length || 1);
  const avgWaiting =
    processStats.reduce((sum, s) => sum + s.waitingTime, 0) /
    (processStats.length || 1);

  const globalStats = {
    totalTime,
    processCount: processes.length,
    cpuBoundCount: processes.filter((p) => p.processNature === 'CPU_BOUND').length,
    ioBoundCount: processes.filter((p) => p.processNature === 'IO_BOUND').length,
    avgTurnaround,
    avgWaiting,
  };

  return { processStats, globalStats };
}
