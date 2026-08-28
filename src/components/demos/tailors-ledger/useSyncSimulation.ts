'use client';

/**
 * The Tailor's Ledger sync simulation (brief §5).
 *
 * An explicit state machine, deliberately structured the way the real sync
 * client is: a reducer over a small set of actions, with the two semantics that
 * matter carried faithfully -
 *
 *   1. APPEND-ONLY. Changing a measurement never mutates an existing record; it
 *      appends a new one. The newest row for a field is its current value.
 *      This is why the real `measurement_values` table has no `updated_at`.
 *   2. FIFO. The queue drains in insertion order, one item at a time.
 *
 * This file contains no UI and no animation, and reads no clock. It is
 * deterministic: the same sequence of actions always produces the same state.
 */

import { useCallback, useEffect, useMemo, useReducer } from 'react';
import {
  FIELD_RANGE,
  FIRST_RECORD_SEQ,
  MEASUREMENT_FIELDS,
  SEED_RECORDS,
  STEP,
} from './data';
import type { MeasurementField, SyncRecord } from './data';
import { DRAIN_INTERVAL_MS } from '../motion';

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

export type Connection = 'online' | 'offline' | 'syncing';

export interface SyncState {
  connection: Connection;
  /** Newest first, which is display order. */
  records: SyncRecord[];
  /** Record ids awaiting push, oldest first. */
  queue: string[];
  /** Next id / sequence number to hand out. Keeps ids deterministic. */
  nextSeq: number;
  /** True once a drain has completed, so the pill can say "Synced just now". */
  hasSynced: boolean;
  /** False until the visitor does anything, which gates the Beat 0 hint. */
  hasInteracted: boolean;
}

/**
 * How many pending rows the demo will accept. Beat 4 asks for three; the cap is
 * a little higher so an enthusiastic visitor is not stopped mid-tap, but the
 * history list still cannot grow without bound.
 */
export const MAX_QUEUE = 6;

export function initialState(): SyncState {
  return {
    connection: 'online',
    records: [...SEED_RECORDS],
    queue: [],
    nextSeq: FIRST_RECORD_SEQ,
    hasSynced: false,
    hasInteracted: false,
  };
}

/* ------------------------------------------------------------------ *
 * Actions
 * ------------------------------------------------------------------ */

export type SyncAction =
  | { type: 'TOGGLE_CONNECTION' }
  | { type: 'ADD_MEASUREMENT'; field: MeasurementField; direction: 1 | -1 }
  | { type: 'DRAIN_ONE' }
  | { type: 'RESET' };

/* ------------------------------------------------------------------ *
 * Selectors
 * ------------------------------------------------------------------ */

/**
 * Current value of a field = the newest record for it. Mirrors the real read
 * path, where `measurement_items.current_value` is only a cache of exactly this.
 */
export function currentValue(state: SyncState, field: MeasurementField): number | null {
  let best: SyncRecord | null = null;
  for (const record of state.records) {
    if (record.field !== field) continue;
    if (!best || record.recordedAt > best.recordedAt) best = record;
  }
  return best ? best.value : null;
}

/** Whether a field can still step in a direction, given its template range. */
export function canStep(
  state: SyncState,
  field: MeasurementField,
  direction: 1 | -1,
): boolean {
  if (state.queue.length >= MAX_QUEUE) return false;
  const value = currentValue(state, field);
  if (value == null) return false;
  const next = round(value + direction * STEP);
  const { min, max } = FIELD_RANGE[field];
  return next >= min && next <= max;
}

/* ------------------------------------------------------------------ *
 * Reducer
 * ------------------------------------------------------------------ */

export function syncReducer(state: SyncState, action: SyncAction): SyncState {
  switch (action.type) {
    case 'TOGGLE_CONNECTION': {
      // Going offline is always allowed, including mid-drain: flipping the
      // switch back during Beat 5 pauses the queue rather than failing it.
      if (state.connection === 'offline') {
        return {
          ...state,
          connection: state.queue.length > 0 ? 'syncing' : 'online',
          hasInteracted: true,
        };
      }
      return { ...state, connection: 'offline', hasInteracted: true };
    }

    case 'ADD_MEASUREMENT': {
      if (state.queue.length >= MAX_QUEUE) return state;

      const value = currentValue(state, action.field);
      if (value == null) return state;

      const next = round(value + action.direction * STEP);
      const { min, max } = FIELD_RANGE[action.field];
      if (next < min || next > max) return state;

      // Append-only: a new immutable row, never an edit of the old one. This is
      // the whole point of the architecture, so the demo must not shortcut it.
      const record: SyncRecord = {
        id: `rec-${state.nextSeq}`,
        field: action.field,
        value: next,
        recordedAt: state.nextSeq,
        label: 'just now',
        status: 'pending',
      };

      return {
        ...state,
        // A local write always lands locally first, online or not. Being online
        // only changes how soon the push happens.
        records: [record, ...state.records],
        queue: [...state.queue, record.id],
        nextSeq: state.nextSeq + 1,
        connection: state.connection === 'offline' ? 'offline' : 'syncing',
        hasInteracted: true,
      };
    }

    case 'DRAIN_ONE': {
      if (state.connection !== 'syncing') return state;
      const [head, ...rest] = state.queue;
      if (head === undefined) return state;

      return {
        ...state,
        records: state.records.map((record) =>
          record.id === head ? { ...record, status: 'synced' } : record,
        ),
        queue: rest,
        connection: rest.length === 0 ? 'online' : 'syncing',
        hasSynced: rest.length === 0 ? true : state.hasSynced,
      };
    }

    case 'RESET':
      return initialState();

    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}

/** Quarter-inch grid. Guards against float drift accumulating over many steps. */
function round(value: number): number {
  return Math.round(value * 4) / 4;
}

/* ------------------------------------------------------------------ *
 * Hook
 * ------------------------------------------------------------------ */

export interface UseSyncSimulationOptions {
  /**
   * Gate for the drain timer. Pass `DemoFrame`'s `isRunning` so nothing ticks
   * off-screen or in a background tab (brief §8). Defaults to true so the
   * reducer can be driven from a scratch page without a frame.
   */
  isRunning?: boolean;
}

export interface SyncSimulation {
  state: SyncState;
  toggleConnection: () => void;
  addMeasurement: (field: MeasurementField, direction: 1 | -1) => void;
  reset: () => void;
  /** Convenience for the UI: current value per field, in template order. */
  fields: Array<{ field: MeasurementField; value: number | null }>;
}

export function useSyncSimulation(
  options: UseSyncSimulationOptions = {},
): SyncSimulation {
  const { isRunning = true } = options;
  const [state, dispatch] = useReducer(syncReducer, undefined, initialState);

  const shouldDrain = state.connection === 'syncing' && state.queue.length > 0;

  // One timer, one item, then the next render schedules the next one. Draining
  // on an interval instead would drift out of step with the exit animations.
  useEffect(() => {
    if (!shouldDrain || !isRunning) return;
    const timer = window.setTimeout(
      () => dispatch({ type: 'DRAIN_ONE' }),
      DRAIN_INTERVAL_MS,
    );
    return () => window.clearTimeout(timer);
  }, [shouldDrain, isRunning, state.queue.length]);

  const toggleConnection = useCallback(() => dispatch({ type: 'TOGGLE_CONNECTION' }), []);
  const addMeasurement = useCallback(
    (field: MeasurementField, direction: 1 | -1) =>
      dispatch({ type: 'ADD_MEASUREMENT', field, direction }),
    [],
  );
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const fields = useMemo(
    () =>
      MEASUREMENT_FIELDS.map((field) => ({
        field,
        value: currentValue(state, field),
      })),
    [state],
  );

  return { state, toggleConnection, addMeasurement, reset, fields };
}
