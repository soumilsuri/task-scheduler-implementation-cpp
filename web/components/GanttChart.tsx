'use client';

import React, { useMemo, useRef, useState } from 'react';
import type { ScheduleStep, Process } from '@/lib/types';
import styles from './GanttChart.module.css';

interface Props {
  steps: ScheduleStep[];
  processes: Process[];
  currentStep: number;
}

const ROW_HEIGHT = 36;
const ROW_GAP = 8;
const LABEL_WIDTH = 52;
const PADDING = { top: 32, bottom: 20, right: 16 };

const EVENT_COLORS: Record<string, string> = {
  CPU:    'var(--accent)',
  IO_WAIT:'var(--accent-io)',
  IO_CPU: 'var(--accent-io-light)',
};

interface TooltipState {
  x: number;
  y: number;
  step: ScheduleStep;
}

export default function GanttChart({ steps, processes, currentStep }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Visible steps up to currentStep
  const visibleSteps = useMemo(
    () => steps.slice(0, currentStep),
    [steps, currentStep]
  );

  // Determine sorted pid list from processes
  const pids = useMemo(
    () => [...processes].sort((a, b) => a.pid - b.pid).map((p) => p.pid),
    [processes]
  );

  const pidIndex = useMemo(
    () => new Map(pids.map((pid, i) => [pid, i])),
    [pids]
  );

  // Time range
  const maxTime = useMemo(() => {
    if (steps.length === 0) return 10;
    return Math.max(...steps.map((s) => s.time + s.duration));
  }, [steps]);

  const svgWidth = 700; // logical SVG width; scales with viewBox
  const chartWidth = svgWidth - LABEL_WIDTH - PADDING.right;
  const svgHeight =
    PADDING.top + pids.length * (ROW_HEIGHT + ROW_GAP) + PADDING.bottom;

  const timeToX = (t: number) => LABEL_WIDTH + (t / maxTime) * chartWidth;
  const pidToY = (pid: number) =>
    PADDING.top + (pidIndex.get(pid) ?? 0) * (ROW_HEIGHT + ROW_GAP);

  // Tick marks
  const tickCount = Math.min(10, maxTime);
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) =>
    Math.round((i / tickCount) * maxTime)
  );

  function handleMouseEnter(e: React.MouseEvent, step: ScheduleStep) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      x: e.clientX - rect.left + 10,
      y: e.clientY - rect.top - 10,
      step,
    });
  }

  function handleMouseLeave() {
    setTooltip(null);
  }

  const processNatureMap = useMemo(
    () => new Map(processes.map((p) => [p.pid, p.processNature])),
    [processes]
  );

  return (
    <div className={styles.wrapper} ref={containerRef}>
      {steps.length === 0 ? (
        <div className={styles.empty}>
          Run the simulation to see the Gantt chart.
        </div>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className={styles.svg}
            aria-label="Gantt chart of process scheduling"
          >
            {/* Grid lines + time ticks */}
            {ticks.map((t) => {
              const x = timeToX(t);
              return (
                <g key={t}>
                  <line
                    x1={x} y1={PADDING.top - 8}
                    x2={x} y2={svgHeight - PADDING.bottom}
                    stroke="var(--border)"
                    strokeWidth="0.5"
                    strokeDasharray="3,3"
                  />
                  <text
                    x={x}
                    y={PADDING.top - 12}
                    textAnchor="middle"
                    fontSize="9"
                    fill="var(--text-dim)"
                    fontFamily="var(--font-mono-raw)"
                  >
                    {t}
                  </text>
                </g>
              );
            })}

            {/* Row backgrounds */}
            {pids.map((pid) => {
              const y = pidToY(pid);
              return (
                <rect
                  key={`bg-${pid}`}
                  x={LABEL_WIDTH}
                  y={y}
                  width={chartWidth}
                  height={ROW_HEIGHT}
                  fill="var(--surface)"
                  rx="3"
                />
              );
            })}

            {/* PID labels */}
            {pids.map((pid) => {
              const y = pidToY(pid);
              const nature = processNatureMap.get(pid) ?? 'CPU_BOUND';
              return (
                <text
                  key={`label-${pid}`}
                  x={LABEL_WIDTH - 8}
                  y={y + ROW_HEIGHT / 2 + 1}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill={nature === 'CPU_BOUND' ? 'var(--accent)' : 'var(--accent-io)'}
                  fontFamily="var(--font-mono-raw)"
                >
                  P{pid}
                </text>
              );
            })}

            {/* Schedule blocks */}
            {visibleSteps.map((step, idx) => {
              const x = timeToX(step.time);
              const w = Math.max(2, timeToX(step.time + step.duration) - x);
              const y = pidToY(step.pid);
              const isLast = idx === visibleSteps.length - 1;
              const color = EVENT_COLORS[step.event] ?? 'var(--accent)';

              return (
                <g key={idx}>
                  <rect
                    x={x}
                    y={y + 2}
                    width={w}
                    height={ROW_HEIGHT - 4}
                    fill={color}
                    opacity={isLast ? 1 : 0.75}
                    rx="3"
                    onMouseEnter={(e) => handleMouseEnter(e, step)}
                    onMouseLeave={handleMouseLeave}
                    style={{ cursor: 'pointer' }}
                  />
                  {w > 22 && (
                    <text
                      x={x + w / 2}
                      y={y + ROW_HEIGHT / 2 + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="9"
                      fill="rgba(255,255,255,0.8)"
                      fontFamily="var(--font-mono-raw)"
                      pointerEvents="none"
                    >
                      {step.event === 'IO_WAIT' ? 'IO' : step.duration}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Current time cursor */}
            {visibleSteps.length > 0 && (() => {
              const last = visibleSteps[visibleSteps.length - 1];
              const cx = timeToX(last.time + last.duration);
              return (
                <line
                  x1={cx} y1={PADDING.top - 4}
                  x2={cx} y2={svgHeight - PADDING.bottom}
                  stroke="var(--accent-active)"
                  strokeWidth="1.5"
                  strokeDasharray="4,3"
                />
              );
            })()}
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div
              className={styles.tooltip}
              style={{ left: tooltip.x, top: tooltip.y }}
            >
              <div className={styles.tooltipPid}>P{tooltip.step.pid}</div>
              <div className={styles.tooltipRow}>
                <span>Event</span>
                <span
                  style={{
                    color: EVENT_COLORS[tooltip.step.event] ?? 'inherit',
                  }}
                >
                  {tooltip.step.event}
                </span>
              </div>
              <div className={styles.tooltipRow}>
                <span>Time</span>
                <span>
                  {tooltip.step.time} &rarr; {tooltip.step.time + tooltip.step.duration}
                </span>
              </div>
              <div className={styles.tooltipRow}>
                <span>vruntime</span>
                <span>
                  {tooltip.step.vruntimeBefore.toFixed(1)} &rarr;{' '}
                  {tooltip.step.vruntimeAfter.toFixed(1)}
                </span>
              </div>
              <div className={styles.tooltipRow}>
                <span>Weight</span>
                <span>{tooltip.step.weight.toFixed(1)}</span>
              </div>
              <div className={styles.tooltipRow}>
                <span>Remaining</span>
                <span>{tooltip.step.remainingBurst}</span>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className={styles.legend}>
            {Object.entries(EVENT_COLORS).map(([event, color]) => (
              <div key={event} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: color }} />
                <span>{event.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
