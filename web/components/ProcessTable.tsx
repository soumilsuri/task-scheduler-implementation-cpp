'use client';

import React, { useCallback } from 'react';
import type { Process, ProcessNature } from '@/lib/types';
import styles from './ProcessTable.module.css';

interface Props {
  processes: Process[];
  onChange: (processes: Process[]) => void;
  disabled?: boolean;
}

const NATURES: ProcessNature[] = ['CPU_BOUND', 'IO_BOUND'];

function emptyProcess(pid: number): Process {
  return {
    pid,
    vruntime: 0,
    cpu_burst_time: 20,
    priority: 1,
    processState: { counter: 50 },
    processNature: 'CPU_BOUND',
  };
}

export default function ProcessTable({ processes, onChange, disabled }: Props) {
  const update = useCallback(
    (index: number, field: keyof Process | 'counter', value: unknown) => {
      const next = processes.map((p, i) => {
        if (i !== index) return p;
        if (field === 'counter') {
          return { ...p, processState: { counter: Number(value) } };
        }
        if (
          field === 'vruntime' ||
          field === 'cpu_burst_time' ||
          field === 'priority'
        ) {
          return { ...p, [field]: Number(value) };
        }
        return { ...p, [field]: value };
      });
      onChange(next);
    },
    [processes, onChange]
  );

  const addRow = useCallback(() => {
    const maxPid = processes.reduce((m, p) => Math.max(m, p.pid), 0);
    onChange([...processes, emptyProcess(maxPid + 1)]);
  }, [processes, onChange]);

  const removeRow = useCallback(
    (index: number) => {
      onChange(processes.filter((_, i) => i !== index));
    },
    [processes, onChange]
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>PID</th>
              <th>Nature</th>
              <th>Priority</th>
              <th>Burst Time</th>
              <th>vruntime</th>
              <th>Counter</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {processes.map((p, i) => (
              <tr key={p.pid} className={styles.row}>
                <td>
                  <span className={styles.pidBadge}>P{p.pid}</span>
                </td>
                <td>
                  <select
                    value={p.processNature}
                    disabled={disabled}
                    onChange={(e) =>
                      update(i, 'processNature', e.target.value as ProcessNature)
                    }
                    className={`${styles.select} ${
                      p.processNature === 'CPU_BOUND'
                        ? styles.selectCpu
                        : styles.selectIo
                    }`}
                  >
                    {NATURES.map((n) => (
                      <option key={n} value={n}>
                        {n === 'CPU_BOUND' ? 'CPU-bound' : 'IO-bound'}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    min={-20}
                    max={19}
                    value={p.priority}
                    disabled={disabled}
                    onChange={(e) => update(i, 'priority', e.target.value)}
                    className={styles.numInput}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={p.cpu_burst_time}
                    disabled={disabled}
                    onChange={(e) => update(i, 'cpu_burst_time', e.target.value)}
                    className={styles.numInput}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    value={p.vruntime}
                    disabled={disabled}
                    onChange={(e) => update(i, 'vruntime', e.target.value)}
                    className={styles.numInput}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    value={p.processState.counter}
                    disabled={disabled}
                    onChange={(e) => update(i, 'counter', e.target.value)}
                    className={styles.numInput}
                  />
                </td>
                <td>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeRow(i)}
                    disabled={disabled || processes.length <= 1}
                    title="Remove process"
                  >
                    &#x2715;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <button
          className={styles.addBtn}
          onClick={addRow}
          disabled={disabled || processes.length >= 12}
        >
          + Add Process
        </button>
        <span className={styles.hint}>
          {processes.length} process{processes.length !== 1 ? 'es' : ''}
        </span>
      </div>
    </div>
  );
}
