'use client';

import React, { useMemo } from 'react';
import type { ScheduleStep, Process } from '@/lib/types';
import styles from './VruntimeChart.module.css';

interface Props {
  steps: ScheduleStep[];
  processes: Process[];
  currentStep: number;
}

export default function VruntimeChart({ steps, processes, currentStep }: Props) {
  const currentStepData = steps[currentStep - 1] ?? null;

  // Build current vruntime state by replaying up to currentStep
  const vruntimeState = useMemo(() => {
    const state = new Map<number, number>();
    processes.forEach((p) => state.set(p.pid, p.vruntime));
    for (let i = 0; i < currentStep && i < steps.length; i++) {
      state.set(steps[i].pid, steps[i].vruntimeAfter);
    }
    return state;
  }, [steps, processes, currentStep]);

  const sortedPids = useMemo(
    () => [...processes].sort((a, b) => a.pid - b.pid).map((p) => p.pid),
    [processes]
  );

  const maxVruntime = useMemo(() => {
    let max = 1;
    vruntimeState.forEach((v) => { if (v > max) max = v; });
    return max;
  }, [vruntimeState]);

  const processNatureMap = useMemo(
    () => new Map(processes.map((p) => [p.pid, p.processNature])),
    [processes]
  );

  const activePid = currentStepData?.pid ?? null;

  if (steps.length === 0) {
    return (
      <div className={styles.empty}>
        Run the simulation to see vruntime evolution.
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.bars}>
        {sortedPids.map((pid) => {
          const vruntime = vruntimeState.get(pid) ?? 0;
          const pct = (vruntime / maxVruntime) * 100;
          const nature = processNatureMap.get(pid) ?? 'CPU_BOUND';
          const isActive = pid === activePid;

          return (
            <div
              key={pid}
              className={`${styles.barRow} ${isActive ? styles.barRowActive : ''}`}
            >
              <span className={styles.pidLabel}>P{pid}</span>
              <div className={styles.trackOuter}>
                <div
                  className={styles.trackFill}
                  style={{
                    width: `${pct}%`,
                    background:
                      nature === 'CPU_BOUND'
                        ? 'var(--accent)'
                        : 'var(--accent-io)',
                    opacity: isActive ? 1 : 0.65,
                  }}
                />
                {isActive && (
                  <div className={styles.activePulse} style={{ left: `${pct}%` }} />
                )}
              </div>
              <span className={styles.vruntimeValue}>
                {vruntime.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        <span className={styles.footerLabel}>vruntime (lower = higher priority)</span>
        <span className={styles.footerMax}>{maxVruntime.toFixed(1)}</span>
      </div>
    </div>
  );
}
