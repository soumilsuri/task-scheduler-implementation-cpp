/**
 * Sample and random data generators for the CFS scheduler demo.
 */

import type { Process } from './types';

/** The 8 processes from the original process.json -- exact same values */
export const SAMPLE_PROCESSES: Process[] = [
  { pid: 1, vruntime: 8,  cpu_burst_time: 30, priority: 1, processState: { counter: 120 }, processNature: 'IO_BOUND'  },
  { pid: 2, vruntime: 12, cpu_burst_time: 70, priority: 2, processState: { counter: 40  }, processNature: 'CPU_BOUND' },
  { pid: 3, vruntime: 14, cpu_burst_time: 50, priority: 3, processState: { counter: 90  }, processNature: 'IO_BOUND'  },
  { pid: 4, vruntime: 18, cpu_burst_time: 80, priority: 2, processState: { counter: 30  }, processNature: 'CPU_BOUND' },
  { pid: 5, vruntime: 10, cpu_burst_time: 40, priority: 1, processState: { counter: 110 }, processNature: 'IO_BOUND'  },
  { pid: 6, vruntime: 20, cpu_burst_time: 95, priority: 3, processState: { counter: 20  }, processNature: 'CPU_BOUND' },
  { pid: 7, vruntime: 16, cpu_burst_time: 35, priority: 1, processState: { counter: 75  }, processNature: 'IO_BOUND'  },
  { pid: 8, vruntime: 22, cpu_burst_time: 60, priority: 2, processState: { counter: 50  }, processNature: 'CPU_BOUND' },
];

const PROCESS_NAMES = [
  'nginx', 'postgres', 'redis', 'node', 'python', 'ffmpeg',
  'gcc', 'tar', 'rsync', 'curl', 'vim', 'bash',
];

/**
 * Generates n realistic random processes for quick experimentation.
 * Priorities are in the range [1, 5] to keep the simulation readable.
 */
export function generateRandomProcesses(n: number = 6): Process[] {
  const count = Math.max(2, Math.min(n, 12));
  const pids = Array.from({ length: count }, (_, i) => i + 1);

  return pids.map((pid, i) => {
    const isIO = Math.random() < 0.45;
    const priority = Math.floor(Math.random() * 5) + 1;
    // IO-bound processes tend to have shorter burst times
    const burstBase = isIO
      ? Math.floor(Math.random() * 30) + 10
      : Math.floor(Math.random() * 80) + 20;

    return {
      pid,
      vruntime: Math.floor(Math.random() * 20) + 1,
      cpu_burst_time: burstBase,
      priority,
      processState: { counter: Math.floor(Math.random() * 100) + 20 },
      processNature: isIO ? 'IO_BOUND' : 'CPU_BOUND',
      _label: PROCESS_NAMES[i % PROCESS_NAMES.length],
    } as Process & { _label?: string };
  });
}

/** Deep clone a process list (safe for mutation by the scheduler) */
export function cloneProcesses(processes: Process[]): Process[] {
  return processes.map((p) => ({
    ...p,
    processState: { ...p.processState },
  }));
}
