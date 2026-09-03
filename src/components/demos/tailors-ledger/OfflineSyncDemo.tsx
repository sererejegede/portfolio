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

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Variants } from 'motion/react';
import DemoFrame, { useDemoStage, useDemoStageState } from '../DemoFrame';
import type { DemoAnnotation } from '../DemoFrame';
import { cn } from '@/lib/utils';
import {
  IDLE_HINT_DELAY_MS,
  badgeVariants,
  easeCheckDraw,
  easeColor,
  easeRingCollapse,
  hintPulseVariants,
  pillLabelVariants,
  rowVariants,
  springBadge,
  springThumb,
  withoutTransforms,
} from '../motion';
import { CLIENT, INCH_MARK, formatInches } from './data';
import type { SyncRecord } from './data';
import {
  canSync,
  previousValue,
  sessionRecords,
  useSyncSimulation,
} from './useSyncSimulation';
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
 * Screen-reader announcements
 * ------------------------------------------------------------------ */

/**
 * What a screen reader should hear for the CURRENT settled state.
 *
 * Deliberately one sentence per state, not per event. The queue changes six
 * times in a single run — three inserts ~780ms apart and three pushes 250ms
 * apart — and narrating each one would be unusable.
 */
export function announcementFor(state: SyncState): string {
  if (state.sync === 'pushing') return 'Syncing.';
  if (state.hasSynced && state.queue.length === 0) return 'All changes synced.';
  if (state.queue.length > 0) {
    const n = state.queue.length;
    return `${n} ${n === 1 ? 'change' : 'changes'} waiting to sync.`;
  }
  if (state.connection === 'offline') {
    return 'Airplane mode on. Measurements are saving on this device.';
  }
  return '';
}

/** How long the state must hold still before it is worth announcing. */
const ANNOUNCE_SETTLE_MS = 700;

/**
 * Announce the state the demo SETTLES on, not every state it passes through
 * (brief §7: "do not announce every frame").
 *
 * Debounced rather than throttled on purpose: a throttle would emit the first
 * value of a burst — "1 change waiting to sync" — and then a stale tail. What a
 * listener wants is where the burst ended up, so each change restarts the timer
 * and only the value that survives `ANNOUNCE_SETTLE_MS` is ever published.
 * A drain of three takes ~750ms and so announces "All changes synced." once,
 * rather than counting 3, 2, 1 down out loud.
 */
function useSettledAnnouncement(message: string): string {
  const [announced, setAnnounced] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => setAnnounced(message), ANNOUNCE_SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [message]);
  return announced;
}

/** The "No changes yet." placeholder. Fade only — it has nowhere to slide from. */
const emptyVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

/**
 * Reduced motion keeps the SEQUENCING and drops the transforms (brief §7): the
 * queue still drains one row at a time — that ordering is what carries the
 * meaning — but nothing slides, scales or draws.
 */
function useMotionVariants(variants: Variants): Variants {
  const { reducedMotion } = useDemoStage();
  return useMemo(
    () => (reducedMotion ? withoutTransforms(variants) : variants),
    [reducedMotion, variants],
  );
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
  const changes = useMemo(() => sessionRecords(state), [state]);
  const offline = state.connection === 'offline';
  const announcement = useSettledAnnouncement(announcementFor(state));

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
        <>
          <AirplaneSwitch
            offline={offline}
            onToggle={toggleConnection}
            hint={!state.hasInteracted}
          />
          {/* Present from first render, empty. A live region added to the DOM at
              the same moment as its text is unreliable — the region has to exist
              before the content it announces. */}
          <p aria-live="polite" aria-atomic="true" className="sr-only">
            {announcement}
          </p>
        </>
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
          className="shrink-0 px-4 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--tl-muted)]"
          id="tl-changes-label"
        >
          This session
        </p>

        {/* Only what this run produced. The seeded values are the set's stored
            state and appear on the rows above; the app has no flat history feed
            (history is per-item and collapsed), so listing one would be a lie. */}
        <ul
          aria-labelledby="tl-changes-label"
          className="min-h-0 flex-1 overflow-y-auto border-t border-[var(--tl-line)]"
        >
          <AnimatePresence initial={false} mode="popLayout">
            {changes.length === 0 ? (
              <motion.li
                key="empty"
                layout
                variants={emptyVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="px-4 py-6 text-center text-[13px] text-[var(--tl-muted)]"
              >
                No changes yet.
              </motion.li>
            ) : (
              changes.map((record) => (
                <ChangeRow
                  key={record.id}
                  record={record}
                  previous={previousValue(state, record)}
                />
              ))
            )}
          </AnimatePresence>
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
      style={{ fontFamily: 'var(--tl-font-ui)' }}
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
  const { reducedMotion } = useDemoStage();
  return (
    <li
      className={cn(
        'relative flex items-center justify-between border-b border-[var(--tl-line)] px-4 py-3',
        // Colour only. Nothing bouncy on a colour change (brief §6).
        'transition-colors duration-200',
        active && 'bg-[var(--tl-accent-tint)]',
      )}
    >
      {/* The wireframe's active-row treatment: a 3px accent bar on the left.
          It wipes in from the top on `scaleY` — a transform, so no layout. */}
      <AnimatePresence initial={false}>
        {active && (
          <motion.span
            key="bar"
            aria-hidden
            initial={reducedMotion ? { opacity: 1 } : { scaleY: 0 }}
            animate={reducedMotion ? { opacity: 1 } : { scaleY: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { scaleY: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' }}
            style={{ originY: 0 }}
            className="absolute left-0 top-0 h-full w-[3px] bg-[var(--tl-accent-stroke)]"
          />
        )}
      </AnimatePresence>
      <span className={cn('text-[14px]', active && 'font-semibold')}>{field}</span>
      <span
        className={cn(
          'text-[15px] tabular-nums transition-colors duration-200',
          active ? 'font-semibold text-[var(--tl-accent-ink)]' : 'text-[var(--tl-ink)]',
        )}
        style={{ fontFamily: 'var(--tl-font-ui)' }}
      >
        {formatInches(value)}
        {INCH_MARK}
      </span>
    </li>
  );
}

function ChangeRow({
  record,
  previous,
}: {
  record: SyncRecord;
  previous: number | null;
}) {
  const pending = record.status === 'pending';
  const variants = useMotionVariants(rowVariants);
  return (
    // `layout` so the rows already in the list slide down as a new one inserts,
    // rather than teleporting (brief §6).
    <motion.li
      layout
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        'flex items-center gap-3 border-b border-[var(--tl-line)] px-4 py-2.5',
        pending && 'opacity-90',
      )}
    >
      <StatusMark pending={pending} />
      <span className="min-w-0 flex-1 truncate text-[13px]">{record.field}</span>
      <span className="shrink-0 text-[13px] tabular-nums">
        {/* The superseded value, shown struck rather than discarded — the old
            row still exists, which is the whole point of an append-only table. */}
        {previous != null && (
          <span className="text-[var(--tl-muted)] line-through">
            {formatInches(previous)}
            {INCH_MARK}
          </span>
        )}
        {/* The arrow is a glyph; the relationship it carries needs saying. */}
        {previous != null && <span className="sr-only"> changed to </span>}
        {previous != null && <span aria-hidden className="px-1 text-[var(--tl-faint)]">→</span>}
        <span className="font-semibold">
          {formatInches(record.value)}
          {INCH_MARK}
        </span>
      </span>
    </motion.li>
  );
}

/**
 * Pending and synced differ in SHAPE, not colour alone (brief §7): a hollow ring
 * versus a drawn check. Colour only reinforces it.
 */
function StatusMark({ pending }: { pending: boolean }) {
  const { reducedMotion } = useDemoStage();
  return (
    <>
      <span className="sr-only">{pending ? 'Not yet synced' : 'Synced'}</span>
      {/* `mode="wait"` is right here and safe: the ring finishes collapsing
          before the check starts drawing, and there is always a next child to
          swap to — unlike the annotation rail, which can go to none. */}
      <AnimatePresence mode="wait" initial={false}>
        {pending ? (
          <motion.span
            key="ring"
            aria-hidden
            exit={reducedMotion ? { opacity: 0 } : { scale: 0 }}
            transition={reducedMotion ? { duration: 0 } : easeRingCollapse}
            className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[var(--tl-accent)]"
          />
        ) : (
          <motion.svg
            key="check"
            aria-hidden
            viewBox="0 0 14 14"
            className="h-3.5 w-3.5 shrink-0"
          >
            {/* `pathLength` is Framer Motion's declarative stroke-dashoffset —
                the check draws itself rather than fading in. */}
            <motion.path
              d="M2.5 7.5 L5.75 10.5 L11.5 3.75"
              fill="none"
              stroke="var(--tl-muted)"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: reducedMotion ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={reducedMotion ? { duration: 0 } : easeCheckDraw}
            />
          </motion.svg>
        )}
      </AnimatePresence>
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
    /* Stacked, not side by side. The phone is ~297px wide at a 390px viewport,
       where "Offline · saving locally" wraps to two lines beside the button and
       changes the bar's height — which shoves the history list. Stacking makes
       the bar height-stable whatever the pill says, and a full-width primary
       button is what the wireframe's `.primary` does anyway. */
    <div className="shrink-0 space-y-2.5 border-t border-[var(--tl-line-2)] bg-[var(--tl-dock)] px-4 py-3">
      <div className="flex items-center">
        {/* `layout` animates the width as the label changes; the colour is a
            plain CSS transition, because nothing bouncy belongs on a colour
            change (brief §6). Never an animated `width` — that would lay out
            every frame. */}
        <motion.span
          layout
          transition={easeColor}
          className={cn(
            'inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--tl-radius-pill)] border px-2.5 py-1 text-[11px]',
            'transition-colors duration-[240ms]',
            pill.tone === 'pending'
              ? 'border-[var(--tl-pending-border)] bg-[var(--tl-pending-bg)] text-[var(--tl-pending-fg)]'
              : 'border-[var(--tl-calm-border)] bg-[var(--tl-calm-bg)] text-[var(--tl-calm-fg)]',
          )}
          style={{ fontFamily: 'var(--tl-font-ui)' }}
        >
          {/* `popLayout` pulls the outgoing label out of flow immediately, so
              the pill can resize to the incoming one while they crossfade. */}
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={pill.id}
              layout="position"
              variants={pillLabelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {pill.label}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      </div>

      <button
        type="button"
        onClick={onSync}
        disabled={!canSyncNow}
        className={cn(
          'relative inline-flex w-full items-center justify-center gap-2 rounded-[var(--tl-radius-lg)] px-4 py-2.5',
          'text-[13.5px] font-semibold',
          // The border is always present, only its colour changes. Applying it
          // on :disabled alone made the button 2px taller when disabled, so the
          // whole bar jumped every time airplane mode flipped `canSync`.
          'border border-transparent bg-[var(--tl-accent)] text-[var(--tl-on-accent)]',
          'disabled:border-[var(--tl-line-2)] disabled:bg-[var(--tl-surface)] disabled:text-[var(--tl-muted)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tl-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--tl-dock)]',
        )}
      >
        {pushing ? 'Syncing' : 'Sync'}
        <AnimatePresence initial={false}>
          {queued > 0 && (
            <motion.span
              key="badge"
              variants={badgeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={cn(
                'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-semibold',
                // A knockout on the filled maroon button; on the disabled ghost
                // button that would be white on white, so it goes neutral.
                canSyncNow
                  ? 'bg-[var(--tl-on-accent)] text-[var(--tl-accent)]'
                  : 'bg-[var(--tl-line-2)] text-[var(--tl-ink)]',
              )}
              style={{ fontFamily: 'var(--tl-font-ui)' }}
            >
              {/* Re-keyed on the count so every increment re-runs the pop. */}
              <motion.span
                key={queued}
                initial={{ scale: 1.18 }}
                animate={{ scale: 1 }}
                transition={springBadge}
              >
                {queued}
              </motion.span>
            </motion.span>
          )}
        </AnimatePresence>
      </button>
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
  const { isRunning, reducedMotion } = useDemoStage();
  const [pulsing, setPulsing] = useState(false);

  /**
   * Beat 0: after a few idle seconds the switch pulses ONCE, and only once.
   * That is the entire attract behaviour — the brief is explicit that
   * autoplaying the sequence would steal the discovery moment. Gated on
   * `isRunning`, so the timer never runs off-screen, and skipped outright
   * under reduced motion.
   */
  useEffect(() => {
    if (!hint || !isRunning || reducedMotion) return;
    const timer = window.setTimeout(() => setPulsing(true), IDLE_HINT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [hint, isRunning, reducedMotion]);

  return (
    <div className="flex items-center gap-3">
      <motion.button
        type="button"
        role="switch"
        aria-checked={offline}
        // The visible text is a sibling, so it has to be associated explicitly -
        // without this the switch announces as "switch, checked" with no name.
        aria-labelledby="tl-airplane-label"
        onClick={onToggle}
        variants={hintPulseVariants}
        animate={pulsing ? 'pulse' : 'rest'}
        onAnimationComplete={() => setPulsing(false)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border',
          'transition-colors duration-200',
          offline ? 'border-primary bg-primary' : 'border-border bg-muted',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        {/* The thumb rides a spring on `x` — a transform, so it never lays out. */}
        <motion.span
          aria-hidden
          className="ml-[3px] block h-[18px] w-[18px] rounded-full bg-background shadow-sm"
          animate={{ x: offline ? 20 : 0 }}
          transition={reducedMotion ? { duration: 0 } : springThumb}
        />
      </motion.button>
      <span id="tl-airplane-label" className="text-sm text-foreground">
        Airplane mode
      </span>
    </div>
  );
}
