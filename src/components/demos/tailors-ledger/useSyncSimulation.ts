'use client';

/**
 * The Tailor's Ledger offline/sync simulation (brief §5).
 *
 * An explicit state machine, deliberately structured the way the real sync
 * client is: a reducer over a small set of actions, carrying the three
 * semantics that actually matter -
 *
 *   1. APPEND-ONLY. A re-measure never mutates an existing record; it appends a
 *      new immutable one. The newest row for a field is its current value. This
 *      is why the real `measurement_values` table has no `updated_at`.
 *   2. FIFO. The queue pushes in insertion order, one row at a time.
 *   3. CAPTURE NEVER BRANCHES ON CONNECTIVITY. Writes land locally whether the
 *      device is online or not, and connectivity is *not* a sync trigger. Sync
 *      is an explicit act - the tailor taps Sync. The airplane switch therefore
 *      proves a negative: nothing about capture changes when it flips.
 *
 * The measurement edits are played back from a fixed script (`SCRIPT` in
 * data.ts) rather than entered by the visitor. Only two controls are real: the
 * airplane switch and Sync.
 *
 * This file contains no UI and no animation, and reads no clock. It is
 * deterministic: the same sequence of actions always produces the same state.
 */

import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { FIRST_RECORD_SEQ, MEASUREMENT_FIELDS, SCRIPT, SEED_RECORDS } from './data';
import type { MeasurementField, SyncRecord } from './data';
import {
  DRAIN_INTERVAL_MS,
  SCRIPT_FOCUS_MS,
  SCRIPT_GAP_MS,
  SCRIPT_LEAD_IN_MS,
} from '../motion';

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

export type Connection = 'online' | 'offline';

/** Whether a push is in flight. Entered only by tapping Sync, never by reconnecting. */
export type SyncPhase = 'idle' | 'pushing';

export interface SyncState {
  connection: Connection;
  sync: SyncPhase;
  /** Newest first, which is display order. */
  records: SyncRecord[];
  /** Record ids awaiting push, oldest first. */
  queue: string[];
  /** Next id / sequence number to hand out. Keeps ids deterministic. */
  nextSeq: number;
  /**
   * The playback runs once the visitor has taken the device offline, and then
   * runs to completion regardless of what the switch does next - because in the
   * real app capture does not care about connectivity.
   */
  scriptStarted: boolean;
  /** How many scripted edits have committed, 0..SCRIPT.length. */
  scriptStep: number;
  /** The row currently lit as "being entered", or null between edits. */
  activeField: MeasurementField | null;
  /** True once a push has completed, so the pill can say "Synced just now". */
  hasSynced: boolean;
  /** False until the visitor touches anything, which gates the Beat 0 hint. */
  hasInteracted: boolean;
}

export function initialState(): SyncState {
  return {
    connection: 'online',
    sync: 'idle',
    records: [...SEED_RECORDS],
    queue: [],
    nextSeq: FIRST_RECORD_SEQ,
    scriptStarted: false,
    scriptStep: 0,
    activeField: null,
    hasSynced: false,
    hasInteracted: false,
  };
}

/* ------------------------------------------------------------------ *
 * Actions
 * ------------------------------------------------------------------ */

export type SyncAction =
  | { type: 'TOGGLE_CONNECTION' }
  | { type: 'FOCUS_FIELD' }
  | { type: 'COMMIT_FIELD' }
  | { type: 'START_SYNC' }
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

/**
 * Records written during this run, OLDEST FIRST.
 *
 * `state.records` is newest-first because that is the order the append-only
 * table is read in, but this list is displayed directly beneath the measurement
 * rows. The playback follows the template's order (Chest, Sleeve length,
 * Waist), so listing oldest-first makes the two lists read down the screen in
 * the same order — and it also means the FIFO drain ticks visibly top to bottom
 * rather than bottom to top.
 *
 * The seeded rows stay in `records` — they are the set's stored values and
 * `currentValue` reads them — but they are NOT listed. The real app does not
 * show a flat history feed; history is per-item and collapsed behind the row.
 * So the demo's list is the honest thing it actually is: the changes this
 * session produced, and their push status. On load it is empty.
 */
export function sessionRecords(state: SyncState): SyncRecord[] {
  return state.records
    .filter((record) => record.recordedAt >= FIRST_RECORD_SEQ)
    .sort((a, b) => a.recordedAt - b.recordedAt);
}

/**
 * The value this record superseded, or null if the field had none. Append-only
 * means the old row is still there to be read - which is the point, so the list
 * shows "26 1/2 -> 26 3/4" rather than just the new number.
 */
export function previousValue(state: SyncState, record: SyncRecord): number | null {
  let best: SyncRecord | null = null;
  for (const candidate of state.records) {
    if (candidate.field !== record.field) continue;
    if (candidate.recordedAt >= record.recordedAt) continue;
    if (!best || candidate.recordedAt > best.recordedAt) best = candidate;
  }
  return best ? best.value : null;
}

/** The playback has more edits to make. */
export function isScriptRunning(state: SyncState): boolean {
  return state.scriptStarted && state.scriptStep < SCRIPT.length;
}

/** A full run is over: everything entered, everything pushed. */
export function isCycleComplete(state: SyncState): boolean {
  return (
    state.scriptStarted && state.scriptStep >= SCRIPT.length && state.queue.length === 0
  );
}

/** Sync is a deliberate act, and only possible with a connection and something to push. */
export function canSync(state: SyncState): boolean {
  return state.connection === 'online' && state.sync === 'idle' && state.queue.length > 0;
}

/* ------------------------------------------------------------------ *
 * Reducer
 * ------------------------------------------------------------------ */

export function syncReducer(state: SyncState, action: SyncAction): SyncState {
  switch (action.type) {
    case 'TOGGLE_CONNECTION': {
      if (state.connection === 'offline') {
        // Coming back online enables Sync. It does not start one - that is the
        // whole correction this demo exists to get right.
        return { ...state, connection: 'online', hasInteracted: true };
      }

      // Going offline after a completed run starts the scenario over, so the
      // demo is repeatable indefinitely without the history growing unbounded.
      if (isCycleComplete(state)) {
        return {
          ...initialState(),
          connection: 'offline',
          scriptStarted: true,
          hasInteracted: true,
        };
      }

      return {
        ...state,
        connection: 'offline',
        // Losing the connection mid-push pauses it. Nothing is lost; the queue
        // is untouched and Sync can be tapped again once back online.
        sync: 'idle',
        scriptStarted: true,
        hasInteracted: true,
      };
    }

    case 'FOCUS_FIELD': {
      if (!isScriptRunning(state) || state.activeField !== null) return state;
      return { ...state, activeField: SCRIPT[state.scriptStep].field };
    }

    case 'COMMIT_FIELD': {
      if (!isScriptRunning(state) || state.activeField === null) return state;
      const edit = SCRIPT[state.scriptStep];

      // Append-only: a new immutable row, never an edit of the old one. This is
      // the whole point of the architecture, so the demo must not shortcut it.
      const record: SyncRecord = {
        id: `rec-${state.nextSeq}`,
        field: edit.field,
        value: edit.value,
        recordedAt: state.nextSeq,
        label: 'just now',
        status: 'pending',
      };

      return {
        ...state,
        records: [record, ...state.records],
        queue: [...state.queue, record.id],
        nextSeq: state.nextSeq + 1,
        scriptStep: state.scriptStep + 1,
        activeField: null,
      };
    }

    case 'START_SYNC': {
      if (!canSync(state)) return state;
      return { ...state, sync: 'pushing', hasInteracted: true };
    }

    case 'DRAIN_ONE': {
      if (state.sync !== 'pushing' || state.connection !== 'online') return state;
      const [head, ...rest] = state.queue;
      if (head === undefined) return state;

      return {
        ...state,
        records: state.records.map((record) =>
          record.id === head ? { ...record, status: 'synced' } : record,
        ),
        queue: rest,
        sync: rest.length === 0 ? 'idle' : 'pushing',
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

/* ------------------------------------------------------------------ *
 * Hook
 * ------------------------------------------------------------------ */

export interface UseSyncSimulationOptions {
  /**
   * Gate for every timer. Pass `DemoFrame`'s `isRunning` so nothing ticks
   * off-screen or in a background tab (brief §8). Defaults to true so the
   * reducer can be driven from a scratch page without a frame.
   */
  isRunning?: boolean;
}

export interface SyncSimulation {
  state: SyncState;
  toggleConnection: () => void;
  startSync: () => void;
  reset: () => void;
  /** Current value per field, in template order, for the measurement rows. */
  fields: Array<{ field: MeasurementField; value: number | null }>;
}

export function useSyncSimulation(options: UseSyncSimulationOptions = {}): SyncSimulation {
  const { isRunning = true } = options;
  const [state, dispatch] = useReducer(syncReducer, undefined, initialState);

  const { activeField, scriptStep, sync, queue } = state;
  const scriptRunning = isScriptRunning(state);

  // Playback, phase one: light up the row about to change.
  useEffect(() => {
    if (!scriptRunning || activeField !== null || !isRunning) return;
    const delay = scriptStep === 0 ? SCRIPT_LEAD_IN_MS : SCRIPT_GAP_MS;
    const timer = window.setTimeout(() => dispatch({ type: 'FOCUS_FIELD' }), delay);
    return () => window.clearTimeout(timer);
  }, [scriptRunning, activeField, scriptStep, isRunning]);

  // Playback, phase two: commit the value and append the record.
  useEffect(() => {
    if (activeField === null || !isRunning) return;
    const timer = window.setTimeout(
      () => dispatch({ type: 'COMMIT_FIELD' }),
      SCRIPT_FOCUS_MS,
    );
    return () => window.clearTimeout(timer);
  }, [activeField, isRunning]);

  // The push. One timer, one row, then the next render schedules the next -
  // draining on an interval would drift out of step with the exit animations.
  useEffect(() => {
    if (sync !== 'pushing' || queue.length === 0 || !isRunning) return;
    const timer = window.setTimeout(() => dispatch({ type: 'DRAIN_ONE' }), DRAIN_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [sync, queue.length, isRunning]);

  const toggleConnection = useCallback(() => dispatch({ type: 'TOGGLE_CONNECTION' }), []);
  const startSync = useCallback(() => dispatch({ type: 'START_SYNC' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const fields = useMemo(
    () =>
      MEASUREMENT_FIELDS.map((field) => ({
        field,
        value: currentValue(state, field),
      })),
    [state],
  );

  return { state, toggleConnection, startSync, reset, fields };
}
