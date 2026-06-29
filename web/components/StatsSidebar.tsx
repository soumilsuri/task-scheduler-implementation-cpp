'use client';

import React, { useMemo } from 'react';
import type { Process, ScheduleStep } from '@/lib/types';
import { computeStats } from '@/lib/scheduler';
import styles from './StatsSidebar.module.css';

interface Props {
  processes: Process[];
  steps: ScheduleStep[];
  currentStep: number;
}

function fmt(n: number) {
  return n.toFixed(1);
}

export default function StatsSidebar({ processes, steps, currentStep }: Props) {
  const { processStats, globalStats } = useMemo(() => {
    if (steps.length === 0 || currentStep === 0) {
      return { processStats: [], globalStats: null };
    }
    // Compute stats only for steps played so far
    const visible = steps.slice(0, currentStep);
    return computeStats(processes, visible);
  }, [processes, steps, currentStep]);

  if (steps.length === 0) {
    return (
      <div className={styles.empty}>
        Stats will appear after running the simulation.
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* Global stats */}
      {globalStats && (
        <div className={styles.globalCards}>
          <div className={styles.card}>
            <span className={styles.cardValue}>{globalStats.totalTime}</span>
            <span className={styles.cardLabel}>Total time</span>
          </div>
          <div className={styles.card}>
            <span className={styles.cardValue}>{fmt(globalStats.avgTurnaround)}</span>
            <span className={styles.cardLabel}>Avg turnaround</span>
          </div>
          <div className={styles.card}>
            <span className={styles.cardValue}>{fmt(globalStats.avgWaiting)}</span>
            <span className={styles.cardLabel}>Avg waiting</span>
          </div>
          <div className={styles.card}>
            <span className={styles.cardValue}>{globalStats.cpuBoundCount}</span>
            <span className={styles.cardLabel}>CPU-bound</span>
          </div>
          <div className={styles.card}>
            <span className={styles.cardValue}>{globalStats.ioBoundCount}</span>
            <span className={styles.cardLabel}>IO-bound</span>
          </div>
        </div>
      )}

      {/* Per-process table */}
      {processStats.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>PID</th>
                <th>Type</th>
                <th>CPU time</th>
                <th>IO wait</th>
                <th>Turnaround</th>
                <th>Waiting</th>
                <th>Steps</th>
              </tr>
            </thead>
            <tbody>
              {processStats.map((s) => (
                <tr key={s.pid} className={styles.row}>
                  <td>
                    <span
                      className={styles.pidCell}
                      style={{
                        color:
                          s.processNature === 'CPU_BOUND'
                            ? 'var(--accent)'
                            : 'var(--accent-io)',
                      }}
                    >
                      P{s.pid}
                    </span>
                  </td>
                  <td>
                    <span
                      className={styles.natureTag}
                      style={{
                        borderColor:
                          s.processNature === 'CPU_BOUND'
                            ? 'rgba(59,130,246,0.3)'
                            : 'rgba(139,92,246,0.3)',
                        color:
                          s.processNature === 'CPU_BOUND'
                            ? 'var(--accent)'
                            : 'var(--accent-io)',
                      }}
                    >
                      {s.processNature === 'CPU_BOUND' ? 'CPU' : 'IO'}
                    </span>
                  </td>
                  <td>{s.totalCpuTime}</td>
                  <td>{s.totalIoWaitTime}</td>
                  <td>{s.turnaroundTime}</td>
                  <td>{s.waitingTime}</td>
                  <td>{s.stepCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
