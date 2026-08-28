'use client';

/**
 * Scratch route for building the demos (brief §12). Not linked from anywhere and
 * not part of the portfolio proper - it exists so each layer can be verified on
 * its own before the next one is stacked on top.
 *
 * Step 3: DemoFrame with static children.
 * Step 4: the reducer, driven by plain buttons, with no animation.
 * Step 5: the real screen wired to the reducer, still with no animation.
 */

import { useMemo, useState } from 'react';
import DemoFrame, { useDemoStageState } from '@/components/demos/DemoFrame';
import type { DemoAnnotation, DemoDevice } from '@/components/demos/DemoFrame';
import OfflineSyncDemo, {
  ANNOTATIONS as DEMO_ANNOTATIONS,
  activeAnnotationId,
  pillState,
} from '@/components/demos/tailors-ledger/OfflineSyncDemo';
import { SCRIPT, formatInches, INCH_MARK } from '@/components/demos/tailors-ledger/data';
import {
  canSync,
  initialState,
  isCycleComplete,
  isScriptRunning,
  syncReducer,
  useSyncSimulation,
} from '@/components/demos/tailors-ledger/useSyncSimulation';
import type { SyncAction } from '@/components/demos/tailors-ledger/useSyncSimulation';

const ANNOTATIONS: DemoAnnotation[] = [
  { id: 'a', text: 'Connection lost — the app does not care' },
  { id: 'b', text: 'Written to on-device SQLite' },
  { id: 'c', text: '3 changes queued · nothing is lost' },
  { id: 'd', text: 'Pushing to Postgres · last-write-wins' },
  { id: 'e', text: 'In sync' },
];

const btn =
  'rounded border border-border px-3 py-1 text-sm disabled:opacity-40 disabled:cursor-not-allowed';
const btnOn = 'rounded border border-primary bg-primary px-3 py-1 text-sm text-primary-foreground';

export default function DemoLabPage() {
  return (
    <main className="container mx-auto max-w-screen-xl space-y-16 px-4 py-16">
      <section>
        <h1 className="mb-1 font-headline text-2xl">Step 5 — the demo screen</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Wired to the reducer. No motion yet.
        </p>
        <OfflineSyncDemo />
      </section>

      <hr className="border-border" />
      <BeatMap />
      <hr className="border-border" />
      <ReducerHarness />
      <hr className="border-border" />
      <FrameSmokeTest />
    </main>
  );
}

/* ------------------------------------------------------------------ *
 * Beat map - the whole sequence folded through the reducer synchronously
 *
 * No timers, no rAF, no IntersectionObserver. This is the one view of the demo
 * that can be verified in an environment that produces no frames, and it is
 * also the clearest statement of which beat produces which pill and caption.
 * ------------------------------------------------------------------ */

const CANONICAL_RUN: Array<{ label: string; action: SyncAction | null }> = [
  { label: 'Beat 0 — idle', action: null },
  { label: 'Beat 1 — airplane mode on', action: { type: 'TOGGLE_CONNECTION' } },
  { label: 'Chest row lights', action: { type: 'FOCUS_FIELD' } },
  { label: 'Beat 3 — Chest commits', action: { type: 'COMMIT_FIELD' } },
  { label: 'Sleeve row lights', action: { type: 'FOCUS_FIELD' } },
  { label: 'Sleeve commits', action: { type: 'COMMIT_FIELD' } },
  { label: 'Waist row lights', action: { type: 'FOCUS_FIELD' } },
  { label: 'Beat 4 — Waist commits', action: { type: 'COMMIT_FIELD' } },
  { label: 'Beat 5 — airplane mode off', action: { type: 'TOGGLE_CONNECTION' } },
  { label: 'Tailor taps Sync', action: { type: 'START_SYNC' } },
  { label: 'push 1 of 3', action: { type: 'DRAIN_ONE' } },
  { label: 'push 2 of 3', action: { type: 'DRAIN_ONE' } },
  { label: 'Beat 5 end — push 3 of 3', action: { type: 'DRAIN_ONE' } },
  { label: 'Beat 6 — Replay', action: { type: 'RESET' } },
];

function BeatMap() {
  const rows = useMemo(() => {
    let state = initialState();
    return CANONICAL_RUN.map(({ label, action }) => {
      if (action) state = syncReducer(state, action);
      const annotationId = activeAnnotationId(state);
      return {
        label,
        connection: state.connection,
        sync: state.sync,
        queue: state.queue.length,
        active: state.activeField ?? '—',
        canSync: canSync(state),
        pill: pillState(state),
        caption: DEMO_ANNOTATIONS.find((a) => a.id === annotationId)?.text ?? '—',
      };
    });
  }, []);

  return (
    <section>
      <h2 className="mb-1 font-headline text-2xl">Beat map</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        The canonical run, folded through the reducer with no timers.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-code text-xs">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-1 pr-4 font-normal">step</th>
              <th className="py-1 pr-4 font-normal">conn</th>
              <th className="py-1 pr-4 font-normal">sync</th>
              <th className="py-1 pr-4 font-normal">queue</th>
              <th className="py-1 pr-4 font-normal">active row</th>
              <th className="py-1 pr-4 font-normal">canSync</th>
              <th className="py-1 pr-4 font-normal">pill</th>
              <th className="py-1 font-normal">caption</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-border/40">
                <td className="whitespace-nowrap py-1 pr-4">{r.label}</td>
                <td className="py-1 pr-4">{r.connection}</td>
                <td className="py-1 pr-4">{r.sync}</td>
                <td className="py-1 pr-4">{r.queue}</td>
                <td className="py-1 pr-4">{r.active}</td>
                <td className="py-1 pr-4">{String(r.canSync)}</td>
                <td className="whitespace-nowrap py-1 pr-4">
                  {r.pill.label}{' '}
                  <span className="text-muted-foreground">[{r.pill.tone}]</span>
                </td>
                <td className="py-1">{r.caption}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Step 4 - state machine, no UI polish, no motion
 * ------------------------------------------------------------------ */

function ReducerHarness() {
  const { state, toggleConnection, startSync, reset, fields } = useSyncSimulation();

  return (
    <section>
      <h2 className="mb-1 font-headline text-2xl">Step 4 — sync reducer</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Plain buttons. Two real controls; the measurements play back from a script.
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button type="button" onClick={toggleConnection} className={btn}>
          Toggle airplane mode
        </button>
        <button type="button" onClick={startSync} disabled={!canSync(state)} className={btn}>
          Sync {state.queue.length > 0 ? `(${state.queue.length})` : ''}
        </button>
        <button type="button" onClick={reset} className={btn}>
          Replay
        </button>
        <span className="ml-4 font-code text-sm text-muted-foreground">
          {fields
            .map(({ field, value }) => `${field} ${formatInches(value)}${INCH_MARK}`)
            .join('   ·   ')}
        </span>
      </div>

      <dl className="mb-6 grid grid-cols-2 gap-x-6 gap-y-1 font-code text-sm sm:grid-cols-4">
        <dt className="text-muted-foreground">connection</dt>
        <dd>{state.connection}</dd>
        <dt className="text-muted-foreground">sync</dt>
        <dd>{state.sync}</dd>
        <dt className="text-muted-foreground">queue</dt>
        <dd>[{state.queue.join(', ')}]</dd>
        <dt className="text-muted-foreground">activeField</dt>
        <dd>{state.activeField ?? '—'}</dd>
        <dt className="text-muted-foreground">script</dt>
        <dd>
          {state.scriptStep}/{SCRIPT.length} {state.scriptStarted ? '(started)' : '(idle)'}
        </dd>
        <dt className="text-muted-foreground">canSync</dt>
        <dd>{String(canSync(state))}</dd>
        <dt className="text-muted-foreground">scriptRunning</dt>
        <dd>{String(isScriptRunning(state))}</dd>
        <dt className="text-muted-foreground">cycleComplete</dt>
        <dd>{String(isCycleComplete(state))}</dd>
        <dt className="text-muted-foreground">hasSynced</dt>
        <dd>{String(state.hasSynced)}</dd>
        <dt className="text-muted-foreground">hasInteracted</dt>
        <dd>{String(state.hasInteracted)}</dd>
        <dt className="text-muted-foreground">nextSeq</dt>
        <dd>{state.nextSeq}</dd>
        <dt className="text-muted-foreground">records</dt>
        <dd>{state.records.length}</dd>
      </dl>

      <table className="w-full max-w-2xl border-collapse font-code text-xs">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-1 pr-4 font-normal">id</th>
            <th className="py-1 pr-4 font-normal">field</th>
            <th className="py-1 pr-4 font-normal">value</th>
            <th className="py-1 pr-4 font-normal">recordedAt</th>
            <th className="py-1 pr-4 font-normal">label</th>
            <th className="py-1 font-normal">status</th>
          </tr>
        </thead>
        <tbody>
          {state.records.map((record) => (
            <tr key={record.id} className="border-b border-border/40">
              <td className="py-1 pr-4">{record.id}</td>
              <td className="py-1 pr-4">{record.field}</td>
              <td className="py-1 pr-4">
                {formatInches(record.value)}
                {INCH_MARK} <span className="text-muted-foreground">({record.value})</span>
              </td>
              <td className="py-1 pr-4">{record.recordedAt}</td>
              <td className="py-1 pr-4">{record.label}</td>
              <td className="py-1">{record.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Step 3 - frame, empty
 * ------------------------------------------------------------------ */

function FrameSmokeTest() {
  const [device, setDevice] = useState<DemoDevice>('phone');
  const [active, setActive] = useState<string | null>(null);
  const { containerRef, stage } = useDemoStageState();

  return (
    <section>
      <h2 className="mb-1 font-headline text-2xl">Step 3 — DemoFrame</h2>
      <p className="mb-6 text-sm text-muted-foreground">Static children, both device variants.</p>

      <div className="mb-10 flex flex-wrap gap-2">
        {(['phone', 'browser'] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDevice(d)}
            className={device === d ? btnOn : btn}
          >
            {d}
          </button>
        ))}
        <span className="mx-2 w-px bg-border" />
        <button type="button" onClick={() => setActive(null)} className={btn}>
          no caption
        </button>
        {ANNOTATIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setActive(a.id)}
            className={active === a.id ? btnOn : btn}
          >
            {a.id}
          </button>
        ))}
      </div>

      <DemoFrame
        stage={stage}
        containerRef={containerRef}
        device={device}
        label="Frame smoke test"
        annotations={ANNOTATIONS}
        activeAnnotationId={active}
        railTitle="What just happened"
        chromeLabel="word-twist.sererejegede.dev"
        onReplay={() => setActive(null)}
      >
        {/* Placeholder screen: a flat fill and a centred label, so the only
            thing under review is the chrome and the rail. */}
        <div className="flex h-full w-full items-center justify-center bg-[#fcfbf8] dark:bg-[#1c1a16]">
          <span className="font-code text-[11px] uppercase tracking-[0.14em] text-[#8c887e]">
            screen
          </span>
        </div>
      </DemoFrame>
    </section>
  );
}
