'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Process, ScheduleStep } from '@/lib/types';
import { runCFS } from '@/lib/scheduler';
import { SAMPLE_PROCESSES, generateRandomProcesses, cloneProcesses } from '@/lib/sampleData';
import ProcessTable from '@/components/ProcessTable';
import StepControls from '@/components/StepControls';
import GanttChart from '@/components/GanttChart';
import VruntimeChart from '@/components/VruntimeChart';
import QueueState from '@/components/QueueState';
import StatsSidebar from '@/components/StatsSidebar';
import AlgorithmDiagram from '@/components/AlgorithmDiagram';
import styles from './page.module.css';

const DEFAULT_SPEED = 200; // ms per step

export default function Home() {
  const [processes, setProcesses] = useState<Process[]>(cloneProcesses(SAMPLE_PROCESSES));
  const [steps, setSteps] = useState<ScheduleStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [hasRun, setHasRun] = useState(false);
  const [activeTab, setActiveTab] = useState<'gantt' | 'vruntime' | 'queue'>('gantt');
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepsRef = useRef<ScheduleStep[]>([]);
  const currentStepRef = useRef(0);

  // Keep refs in sync (must be in effect, not during render)
  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  // -----------------------------------------------------------------------
  // Playback engine
  // -----------------------------------------------------------------------
  const stopInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startInterval = useCallback(() => {
    stopInterval();
    intervalRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= stepsRef.current.length) {
          stopInterval();
          setIsPlaying(false);
          return stepsRef.current.length;
        }
        return next;
      });
    }, speed);
  }, [speed, stopInterval]);

  // Restart interval when speed changes while playing
  useEffect(() => {
    if (isPlaying) {
      startInterval();
    }
    return stopInterval;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed]);

  // Cleanup on unmount
  useEffect(() => () => stopInterval(), [stopInterval]);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------
  const handleRun = useCallback(() => {
    setError(null);
    try {
      if (processes.length === 0) {
        setError('Add at least one process before running.');
        return;
      }
      if (processes.some((p) => p.cpu_burst_time <= 0)) {
        setError('All processes must have cpu_burst_time > 0.');
        return;
      }
      const result = runCFS(cloneProcesses(processes));
      setSteps(result.steps);
      stepsRef.current = result.steps;
      setCurrentStep(0);
      currentStepRef.current = 0;
      setIsPlaying(false);
      setHasRun(true);
      stopInterval();
    } catch (e) {
      setError(String(e));
    }
  }, [processes, stopInterval]);

  const handlePlay = useCallback(() => {
    if (currentStepRef.current >= stepsRef.current.length) {
      setCurrentStep(0);
      currentStepRef.current = 0;
    }
    setIsPlaying(true);
    startInterval();
  }, [startInterval]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    stopInterval();
  }, [stopInterval]);

  const handleStepForward = useCallback(() => {
    stopInterval();
    setIsPlaying(false);
    setCurrentStep((prev) => Math.min(prev + 1, stepsRef.current.length));
  }, [stopInterval]);

  const handleStepBack = useCallback(() => {
    stopInterval();
    setIsPlaying(false);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, [stopInterval]);

  const handleReset = useCallback(() => {
    stopInterval();
    setIsPlaying(false);
    setCurrentStep(0);
  }, [stopInterval]);

  const handleLoadSample = useCallback(() => {
    stopInterval();
    setIsPlaying(false);
    setSteps([]);
    setCurrentStep(0);
    setHasRun(false);
    setError(null);
    setProcesses(cloneProcesses(SAMPLE_PROCESSES));
  }, [stopInterval]);

  const handleRandomize = useCallback(() => {
    stopInterval();
    setIsPlaying(false);
    setSteps([]);
    setCurrentStep(0);
    setHasRun(false);
    setError(null);
    const count = Math.floor(Math.random() * 5) + 4; // 4-8 processes
    setProcesses(generateRandomProcesses(count));
  }, [stopInterval]);

  const handleProcessChange = useCallback((next: Process[]) => {
    setProcesses(next);
    // Invalidate results when input changes
    if (hasRun) {
      stopInterval();
      setIsPlaying(false);
      setSteps([]);
      setCurrentStep(0);
      setHasRun(false);
    }
  }, [hasRun, stopInterval]);

  // -----------------------------------------------------------------------
  // Current step info for status bar
  // -----------------------------------------------------------------------
  const currentStepData = steps[currentStep - 1] ?? null;

  return (
    <div className={styles.page}>
      {/* ----------------------------------------------------------------
          Header
      ----------------------------------------------------------------- */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.logo}>
              <span className={styles.logoIcon}>&#x22CF;</span>
              <span className={styles.logoText}>cfs-viz</span>
            </div>
            <span className={styles.headerSub}>
              Completely Fair Scheduler &mdash; interactive simulation
            </span>
          </div>
          <div className={styles.headerRight}>
            <a
              href="https://github.com/soumilsuri/task-scheduler-implementation-cpp"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.headerLink}
            >
              <GitHubIcon />
              GitHub
            </a>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* ----------------------------------------------------------------
            Top bar: data controls + Run button
        ----------------------------------------------------------------- */}
        <section className={styles.topBar}>
          <div className={styles.dataActions}>
            <button className={styles.btnSecondary} onClick={handleLoadSample} id="load-sample-btn">
              Load Sample Data
            </button>
            <button className={styles.btnSecondary} onClick={handleRandomize} id="randomize-btn">
              Randomize Tasks
            </button>
          </div>

          <button
            className={styles.btnPrimary}
            onClick={handleRun}
            id="run-simulation-btn"
          >
            {hasRun ? 'Re-run Simulation' : 'Run Simulation'}
          </button>
        </section>

        {/* Error */}
        {error && (
          <div className={styles.errorBanner}>
            <span className={styles.errorIcon}>!</span>
            {error}
          </div>
        )}

        {/* ----------------------------------------------------------------
            Process input table
        ----------------------------------------------------------------- */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Processes</h2>
            <span className={styles.sectionHint}>
              Edit inline. Changes invalidate the current simulation.
            </span>
          </div>
          <ProcessTable
            processes={processes}
            onChange={handleProcessChange}
            disabled={isPlaying}
          />
        </section>

        {/* ----------------------------------------------------------------
            Step controls
        ----------------------------------------------------------------- */}
        <section className={`${styles.section} ${styles.controlsSection}`}>
          <StepControls
            currentStep={currentStep}
            totalSteps={steps.length}
            isPlaying={isPlaying}
            speed={speed}
            hasResult={hasRun}
            onPlay={handlePlay}
            onPause={handlePause}
            onStepForward={handleStepForward}
            onStepBack={handleStepBack}
            onReset={handleReset}
            onSpeedChange={setSpeed}
          />
        </section>

        {/* ----------------------------------------------------------------
            Status strip (current step info)
        ----------------------------------------------------------------- */}
        {currentStepData && (
          <div className={styles.statusStrip}>
            <span className={styles.statusItem}>
              <span className={styles.statusKey}>PID</span>
              <span className={styles.statusVal}>P{currentStepData.pid}</span>
            </span>
            <span className={styles.statusDivider} />
            <span className={styles.statusItem}>
              <span className={styles.statusKey}>Event</span>
              <span
                className={styles.statusVal}
                style={{
                  color:
                    currentStepData.event === 'CPU'
                      ? 'var(--accent)'
                      : 'var(--accent-io)',
                }}
              >
                {currentStepData.event}
              </span>
            </span>
            <span className={styles.statusDivider} />
            <span className={styles.statusItem}>
              <span className={styles.statusKey}>Time</span>
              <span className={styles.statusVal}>
                {currentStepData.time} &rarr; {currentStepData.time + currentStepData.duration}
              </span>
            </span>
            <span className={styles.statusDivider} />
            <span className={styles.statusItem}>
              <span className={styles.statusKey}>vruntime</span>
              <span className={styles.statusVal}>
                {currentStepData.vruntimeBefore.toFixed(1)} &rarr;{' '}
                {currentStepData.vruntimeAfter.toFixed(1)}
              </span>
            </span>
            <span className={styles.statusDivider} />
            <span className={styles.statusItem}>
              <span className={styles.statusKey}>Weight</span>
              <span className={styles.statusVal}>
                {currentStepData.weight.toFixed(2)}
              </span>
            </span>
            <span className={styles.statusDivider} />
            <span className={styles.statusItem}>
              <span className={styles.statusKey}>Remaining</span>
              <span className={styles.statusVal}>
                {currentStepData.remainingBurst}t
              </span>
            </span>
          </div>
        )}

        {/* ----------------------------------------------------------------
            Visualization area
        ----------------------------------------------------------------- */}
        <div className={styles.vizGrid}>
          {/* Left: tabbed charts */}
          <section className={styles.vizMain}>
            <div className={styles.tabs}>
              {(['gantt', 'vruntime', 'queue'] as const).map((tab) => (
                <button
                  key={tab}
                  className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'gantt' && 'Gantt Chart'}
                  {tab === 'vruntime' && 'vruntime'}
                  {tab === 'queue' && 'Queue State'}
                </button>
              ))}
            </div>

            <div className={styles.tabContent}>
              {activeTab === 'gantt' && (
                <GanttChart
                  steps={steps}
                  processes={processes}
                  currentStep={currentStep}
                />
              )}
              {activeTab === 'vruntime' && (
                <VruntimeChart
                  steps={steps}
                  processes={processes}
                  currentStep={currentStep}
                />
              )}
              {activeTab === 'queue' && (
                <QueueState
                  steps={steps}
                  currentStep={currentStep}
                />
              )}
            </div>
          </section>

          {/* Right: stats */}
          <section className={styles.vizSide}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Statistics</h2>
            </div>
            <StatsSidebar
              processes={processes}
              steps={steps}
              currentStep={currentStep}
            />
          </section>
        </div>

        {/* ----------------------------------------------------------------
            Algorithm explanation
        ----------------------------------------------------------------- */}
        <section className={styles.section}>
          <AlgorithmDiagram />
        </section>
      </main>

      <footer className={styles.footer}>
        <span>CFS Scheduler Visualizer</span>
        <span className={styles.footerDivider}>&#x2022;</span>
        <span>
          Algorithm ported from{' '}
          <a
            href="https://github.com/soumilsuri/task-scheduler-implementation-cpp"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            task-scheduler-implementation-cpp
          </a>
        </span>
      </footer>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}
