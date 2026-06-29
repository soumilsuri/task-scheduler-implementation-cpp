'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import styles from './AlgorithmDiagram.module.css';

export default function AlgorithmDiagram() {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.toggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={styles.toggleIcon}>{open ? '-' : '+'}</span>
        <span>How CFS works</span>
        <span className={styles.toggleSub}>
          Completely Fair Scheduler algorithm explained
        </span>
      </button>

      {open && (
        <div className={styles.content}>
          <div className={styles.textBlock}>
            <h3 className={styles.heading}>Completely Fair Scheduler (CFS)</h3>
            <p className={styles.para}>
              CFS is the default Linux process scheduler. Instead of fixed time
              slices, it tracks a <code>vruntime</code> (virtual runtime) for
              each process. The scheduler always picks the process with the
              lowest vruntime, so CPU time is distributed proportionally to
              priority weights.
            </p>

            <div className={styles.keyPoints}>
              <div className={styles.point}>
                <span className={styles.pointLabel}>Weight formula</span>
                <code className={styles.code}>
                  weight = NICE_0_LOAD &times; 1.25<sup>(-priority)</sup>
                </code>
                <span className={styles.pointNote}>
                  Each priority step changes the weight by ~25%. Higher priority
                  = lower number = larger weight.
                </span>
              </div>

              <div className={styles.point}>
                <span className={styles.pointLabel}>vruntime update</span>
                <code className={styles.code}>
                  vruntime += (executed_time &times; NICE_0_LOAD) / weight
                </code>
                <span className={styles.pointNote}>
                  Low-priority processes accumulate vruntime faster, so they
                  get less frequent CPU scheduling. High-priority processes
                  advance vruntime slowly.
                </span>
              </div>

              <div className={styles.point}>
                <span className={styles.pointLabel}>IO-bound handling</span>
                <code className={styles.code}>IO wait (10t) then 1t CPU</code>
                <span className={styles.pointNote}>
                  IO-bound processes simulate a wait period, update vruntime
                  accordingly, then do minimal CPU work before being re-queued.
                </span>
              </div>

              <div className={styles.point}>
                <span className={styles.pointLabel}>Data structure</span>
                <code className={styles.code}>
                  min-heap ordered by vruntime
                </code>
                <span className={styles.pointNote}>
                  O(log n) insertion and O(1) peek. The process with the
                  smallest vruntime is always at the top.
                </span>
              </div>
            </div>
          </div>

          <div className={styles.imageBlock}>
            <Image
              src="/algorithm.png"
              alt="CFS algorithm flow diagram showing weight formula, vruntime update, and priority table"
              width={700}
              height={420}
              className={styles.diagram}
              priority
            />
            <p className={styles.imageCaption}>
              CFS algorithm flow: weight calculation, vruntime update, and
              the priority-to-weight table (nice -20 to +19).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
