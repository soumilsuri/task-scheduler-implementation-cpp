'use client';

import React from 'react';
import styles from './StepControls.module.css';

interface Props {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number; // ms per step
  hasResult: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onSpeedChange: (ms: number) => void;
}

const SPEED_OPTIONS = [
  { label: '0.25x', ms: 800 },
  { label: '0.5x',  ms: 400 },
  { label: '1x',    ms: 200 },
  { label: '2x',    ms: 100 },
  { label: '4x',    ms: 50  },
  { label: '8x',    ms: 25  },
];

export default function StepControls({
  currentStep,
  totalSteps,
  isPlaying,
  speed,
  hasResult,
  onPlay,
  onPause,
  onStepForward,
  onStepBack,
  onReset,
  onSpeedChange,
}: Props) {
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
  const atEnd = currentStep >= totalSteps;
  const atStart = currentStep === 0;

  return (
    <div className={styles.wrapper}>
      {/* Progress bar */}
      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className={styles.row}>
        {/* Transport controls */}
        <div className={styles.transport}>
          <button
            className={styles.btn}
            onClick={onReset}
            disabled={!hasResult || atStart}
            title="Reset"
          >
            <ResetIcon />
          </button>

          <button
            className={styles.btn}
            onClick={onStepBack}
            disabled={!hasResult || atStart}
            title="Step back"
          >
            <StepBackIcon />
          </button>

          <button
            className={`${styles.btn} ${styles.playBtn}`}
            onClick={isPlaying ? onPause : onPlay}
            disabled={!hasResult || atEnd}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          <button
            className={styles.btn}
            onClick={onStepForward}
            disabled={!hasResult || atEnd}
            title="Step forward"
          >
            <StepForwardIcon />
          </button>
        </div>

        {/* Step counter */}
        <div className={styles.counter}>
          {hasResult ? (
            <>
              <span className={styles.counterCurrent}>{currentStep}</span>
              <span className={styles.counterSep}>/</span>
              <span className={styles.counterTotal}>{totalSteps}</span>
              <span className={styles.counterLabel}>steps</span>
            </>
          ) : (
            <span className={styles.counterLabel}>run to start</span>
          )}
        </div>

        {/* Speed selector */}
        <div className={styles.speedGroup}>
          <span className={styles.speedLabel}>Speed</span>
          <div className={styles.speedOptions}>
            {SPEED_OPTIONS.map((opt) => (
              <button
                key={opt.ms}
                className={`${styles.speedBtn} ${speed === opt.ms ? styles.speedBtnActive : ''}`}
                onClick={() => onSpeedChange(opt.ms)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Icon components
function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function StepForwardIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 15,12 5,21" />
      <rect x="17" y="3" width="3" height="18" />
    </svg>
  );
}

function StepBackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="19,3 9,12 19,21" />
      <rect x="4" y="3" width="3" height="18" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
    </svg>
  );
}
