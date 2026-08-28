'use client';

/**
 * Tailor's Ledger — offline / sync demo.
 *
 * Step 5 of the build order: the real screen, wired to the reducer, with no
 * motion yet. Everything animates in step 6.
 *
 * Layering, which the demo is deliberate about:
 *   - AIRPLANE MODE is an environment control, so it lives *outside* the phone,
 *     beside the annotation rail. It is not part of the app.
 *   - SYNC is an app action, so it lives inside the app screen.
 *   - The three measurement edits are played back, not entered. The visitor
 *     never types anything.
 *
 * Compression worth naming: in the real app the Sync control sits on a separate
 * Settings/backup screen. Putting it on this screen collapses two screens into
 * one so the whole idea fits in a single frame. Everything else about the flow
 * is faithful - most importantly that connectivity never triggers a push.
 */

import { useMemo } from 'react';
import DemoFrame, { useDemoStageState } from '../DemoFrame';
import type { DemoAnnotation } from '../DemoFrame';
import { cn } from '@/lib/utils';
import { CLIENT, INCH_MARK, formatInches } from './data';
import type { SyncRecord } from './data';
import { canSync, useSyncSimulation } from './useSyncSimulation';
import type { SyncState } from './useSyncSimulation';
import './tokens.css';

/* ------------------------------------------------------------------ *
 * Derived display state
 * ------------------------------------------------------------------ */

type Tone = 'calm' | 'pending';

export interface PillState {
  id: string;
  label: string;
  tone: Tone;
}

/**
 * The pill's tone follows whether there is unpushed work, not whether there is
 * a connection - an online device holding three unsynced rows is every bit as
 * pending as an offline one.
 */
export function pillState(state: SyncState): PillState {
  if (state.connection === 'offline') {
    return { id: 'offline', label: 'Offline · saving locally', tone: 'pending' };
  }
  if (state.sync === 'pushing') {
    return { id: 'pushing', label: 'Syncing…', tone: 'pending' };
  }
  if (state.queue.length > 0) {
    const n = state.queue.length;
    return { id: 'queued', label: `${n} waiting to sync`, tone: 'pending' };
  }
  if (state.hasSynced) {
    return { id: 'synced', label: 'Synced just now', tone: 'calm' };
  }
  return { id: 'online', label: 'Online', tone: 'calm' };
}

export const ANNOTATIONS: readonly DemoAnnotation[] = [
  { id: 'offline', text: 'Connection lost — the app does not care' },
  { id: 'written', text: 'Written to on-device SQLite' },
  { id: 'queued', text: '3 changes queued · nothing is lost' },
  { id: 'pushing', text: 'Pushing to Postgres · last-write-wins' },
  { id: 'in-sync', text: 'In sync' },
];

/** Which caption the rail shows. Most specific beat first. */
export function activeAnnotationId(state: SyncState): string | null {
  if (state.sync === 'pushing') return 'pushing';
  if (state.hasSynced && state.queue.length === 0) return 'in-sync';
  if (state.queue.length >= 3) return 'queued';
  if (state.queue.length > 0) return 'written';
  if (state.connection === 'offline') return 'offline';
  return null;
}

/* ------------------------------------------------------------------ *
 * Demo
 * ------------------------------------------------------------------ */

export default function OfflineSyncDemo() {
  const { containerRef, stage } = useDemoStageState();
  const { state, toggleConnection, startSync, reset, fields } = useSyncSimulation({
    isRunning: stage.isRunning,
  });

  const pill = useMemo(() => pillState(state), [state]);
  const offline = state.connection === 'offline';

  return (
    <DemoFrame
      stage={stage}
      containerRef={containerRef}
      device="phone"
      label="Tailor's Ledger — offline capture and manual sync"
      annotations={ANNOTATIONS}
      activeAnnotationId={activeAnnotationId(state)}
      railTitle="What just happened"
      onReplay={reset}
      aside={
        <AirplaneSwitch
          offline={offline}
          onToggle={toggleConnection}
          hint={!state.hasInteracted}
        />
      }
    >
      <div
        className="tl-demo flex h-full w-full flex-col bg-[var(--tl-screen)] text-[var(--tl-ink)]"
        style={{ fontFamily: 'var(--tl-font-ui)' }}
      >
        <StatusBar offline={offline} />

        <header className="shrink-0 border-b border-[var(--tl-line)] px-4 pb-3 pt-2">
          <h3
            className="text-[19px] font-semibold leading-tight tracking-[-0.01em]"
            style={{ fontFamily: 'var(--tl-font-display)' }}
          >
            {CLIENT.setLabel}
          </h3>
          <p className="mt-0.5 text-[13px] text-[var(--tl-muted)]">
            {CLIENT.name} · {CLIENT.templateName}
          </p>
        </header>

        {/* Current values. Each is a cache of the newest history row below. */}
        <ul className="shrink-0">
          {fields.map(({ field, value }) => (
            <MeasurementRow
              key={field}
              field={field}
              value={value}
              active={state.activeField === field}
            />
          ))}
        </ul>

        <p
          className="shrink-0 px-4 pb-1.5 pt-4 text-[10px] uppercase tracking-[0.14em] text-[var(--tl-muted)]"
          style={{ fontFamily: 'var(--tl-font-mono)' }}
          id="tl-history-label"
        >
          History
        </p>

        <ul
          aria-labelledby="tl-history-label"
          className="min-h-0 flex-1 overflow-y-auto border-t border-[var(--tl-line)]"
        >
          {state.records.map((record) => (
            <HistoryRow key={record.id} record={record} />
          ))}
        </ul>

        <SyncBar
          pill={pill}
          queued={state.queue.length}
          canSyncNow={canSync(state)}
          pushing={state.sync === 'pushing'}
          onSync={startSync}
        />
      </div>
    </DemoFrame>
  );
}

/* ------------------------------------------------------------------ *
 * Screen parts
 * ------------------------------------------------------------------ */

/** Device chrome, not app UI. Decorative: the pill below carries the meaning. */
function StatusBar({ offline }: { offline: boolean }) {
  return (
    <div
      aria-hidden
      className="flex h-[30px] shrink-0 items-center justify-between px-[22px] text-[11px]"
      style={{ fontFamily: 'var(--tl-font-mono)' }}
    >
      <span>9:41</span>
      <span className="tracking-[2px] text-[var(--tl-muted)]">
        {offline ? '✈' : '•••'}
      </span>
    </div>
  );
}

function MeasurementRow({
  field,
  value,
  active,
}: {
  field: string;
  value: number | null;
  active: boolean;
}) {
  return (
    <li
      className={cn(
        'relative flex items-center justify-between border-b border-[var(--tl-line)] px-4 py-3',
        active && 'bg-[var(--tl-accent-tint)]',
      )}
    >
      {/* The wireframe's active-row treatment: a 3px accent bar on the left. */}
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-0 h-full w-[3px] bg-[var(--tl-accent)]"
        />
      )}
      <span className={cn('text-[14px]', active && 'font-semibold')}>{field}</span>
      <span
        className={cn(
          'text-[15px] tabular-nums',
          active ? 'font-semibold text-[var(--tl-accent-ink)]' : 'text-[var(--tl-ink)]',
        )}
        style={{ fontFamily: 'var(--tl-font-mono)' }}
      >
        {formatInches(value)}
        {INCH_MARK}
      </span>
    </li>
  );
}

function HistoryRow({ record }: { record: SyncRecord }) {
  const pending = record.status === 'pending';
  return (
    <li
      className={cn(
        'flex items-center gap-3 border-b border-[var(--tl-line)] px-4 py-2.5',
        pending && 'opacity-90',
      )}
    >
      <StatusMark pending={pending} />
      <span className="min-w-0 flex-1 truncate text-[13px]">{record.field}</span>
      <span
        className="text-[13px] tabular-nums"
        style={{ fontFamily: 'var(--tl-font-mono)' }}
      >
        {formatInches(record.value)}
        {INCH_MARK}
      </span>
      <span
        className="w-[52px] shrink-0 text-right text-[10.5px] text-[var(--tl-muted)]"
        style={{ fontFamily: 'var(--tl-font-mono)' }}
      >
        {record.label}
      </span>
    </li>
  );
}

/**
 * Pending and synced differ in SHAPE, not colour alone (brief §7): a hollow ring
 * versus a drawn check. Colour only reinforces it.
 */
function StatusMark({ pending }: { pending: boolean }) {
  return (
    <>
      <span className="sr-only">{pending ? 'Not yet synced' : 'Synced'}</span>
      {pending ? (
        <span
          aria-hidden
          className="h-3.5 w-3.5 shrink-0 rounded-full border-[1.5px] border-[var(--tl-accent)]"
        />
      ) : (
        <svg aria-hidden viewBox="0 0 14 14" className="h-3.5 w-3.5 shrink-0">
          <path
            d="M2.5 7.5 L5.75 10.5 L11.5 3.75"
            fill="none"
            stroke="var(--tl-muted)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </>
  );
}

function SyncBar({
  pill,
  queued,
  canSyncNow,
  pushing,
  onSync,
}: {
  pill: PillState;
  queued: number;
  canSyncNow: boolean;
  pushing: boolean;
  onSync: () => void;
}) {
  return (
    <div className="shrink-0 border-t border-[var(--tl-line-2)] bg-[var(--tl-dock)] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-[var(--tl-radius-pill)] border px-2.5 py-1 text-[11px]',
            pill.tone === 'pending'
              ? 'border-[var(--tl-pending-border)] bg-[var(--tl-pending-bg)] text-[var(--tl-pending-fg)]'
              : 'border-[var(--tl-calm-border)] bg-[var(--tl-calm-bg)] text-[var(--tl-calm-fg)]',
          )}
          style={{ fontFamily: 'var(--tl-font-mono)' }}
        >
          {pill.label}
        </span>

        <button
          type="button"
          onClick={onSync}
          disabled={!canSyncNow}
          className={cn(
            'relative inline-flex shrink-0 items-center gap-2 rounded-[var(--tl-radius-md)] px-4 py-2',
            'text-[13.5px] font-semibold',
            'bg-[var(--tl-accent)] text-[var(--tl-on-accent)]',
            'disabled:bg-[var(--tl-line-2)] disabled:text-[var(--tl-muted)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tl-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--tl-dock)]',
          )}
        >
          {pushing ? 'Syncing' : 'Sync'}
          {queued > 0 && (
            <span
              className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--tl-on-accent)] px-1 text-[11px] font-semibold text-[var(--tl-accent-ink)]"
              style={{ fontFamily: 'var(--tl-font-mono)' }}
            >
              {queued}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Environment control — outside the phone on purpose
 * ------------------------------------------------------------------ */

function AirplaneSwitch({
  offline,
  onToggle,
  hint,
}: {
  offline: boolean;
  onToggle: () => void;
  hint: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={offline}
        onClick={onToggle}
        data-hint={hint || undefined}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors',
          offline ? 'border-primary bg-primary' : 'border-border bg-muted',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'ml-[3px] block h-[18px] w-[18px] rounded-full bg-background shadow-sm',
            offline && 'translate-x-[20px]',
          )}
        />
      </button>
      <span className="text-sm text-foreground">Airplane mode</span>
    </div>
  );
}
