'use client';

import React, { useMemo } from 'react';
import type { ScheduleStep } from '@/lib/types';
import styles from './QueueState.module.css';

interface Props {
  steps: ScheduleStep[];
  currentStep: number;
}

export default function QueueState({ steps, currentStep }: Props) {
  const snapshot = useMemo(() => {
    if (currentStep === 0 || steps.length === 0) return null;
    // The queue snapshot at the END of step `currentStep-1` is the one
    // BEFORE that step ran (captured at step start). For UI, show what's
    // queued AFTER the current step ran, which equals the next step's snapshot.
    const idx = Math.min(currentStep - 1, steps.length - 1);
    return steps[idx].queueSnapshot;
  }, [steps, currentStep]);

  const activePid = useMemo(() => {
    if (currentStep === 0 || steps.length === 0) return null;
    return steps[Math.min(currentStep - 1, steps.length - 1)].pid;
  }, [steps, currentStep]);

  if (steps.length === 0) {
    return (
      <div className={styles.empty}>
        Run the simulation to see queue state.
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className={styles.empty}>Press play or step forward.</div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* Currently executing */}
      {activePid !== null && (
        <div className={styles.activeSection}>
          <span className={styles.sectionLabel}>Executing</span>
          <div className={styles.activeNode}>
            <span className={styles.activeNodePid}>P{activePid}</span>
            <span className={styles.cpuIcon}>CPU</span>
          </div>
        </div>
      )}

      {/* Queue */}
      <div className={styles.queueSection}>
        <span className={styles.sectionLabel}>
          Ready Queue ({snapshot.length})
        </span>
        {snapshot.length === 0 ? (
          <span className={styles.emptyQueue}>empty</span>
        ) : (
          <div className={styles.nodes}>
            {snapshot.map((item, i) => (
              <div key={item.pid} className={styles.node}>
                <div className={styles.nodeInner}>
                  <span
                    className={styles.nodePid}
                    style={{
                      color:
                        item.processNature === 'CPU_BOUND'
                          ? 'var(--accent)'
                          : 'var(--accent-io)',
                    }}
                  >
                    P{item.pid}
                  </span>
                  <span className={styles.nodeVruntime}>
                    {item.vruntime.toFixed(1)}
                  </span>
                  <span className={styles.nodeBurst}>
                    {item.cpu_burst_time}t
                  </span>
                </div>
                {i < snapshot.length - 1 && (
                  <span className={styles.arrow}>&rsaquo;</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.hint}>
        Ordered by vruntime (lowest first)
      </div>
    </div>
  );
}
