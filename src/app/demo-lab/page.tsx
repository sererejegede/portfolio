'use client';

/**
 * Scratch route for building the demos (brief §12, steps 3-4). Not linked from
 * anywhere and not part of the portfolio proper - it exists so each layer can be
 * verified on its own before the next one is stacked on top.
 *
 * Step 3: DemoFrame with static children.
 * Step 4: the reducer, driven by plain buttons, with no animation anywhere.
 */

import { useState } from 'react';
import DemoFrame from '@/components/demos/DemoFrame';
import type { DemoAnnotation, DemoDevice } from '@/components/demos/DemoFrame';
import { MEASUREMENT_FIELDS, formatInches, INCH_MARK } from '@/components/demos/tailors-ledger/data';
import {
  canStep,
  MAX_QUEUE,
  useSyncSimulation,
} from '@/components/demos/tailors-ledger/useSyncSimulation';

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
      <ReducerHarness />
      <hr className="border-border" />
      <FrameSmokeTest />
    </main>
  );
}

/* ------------------------------------------------------------------ *
 * Step 4 - state machine, no UI polish, no motion
 * ------------------------------------------------------------------ */

function ReducerHarness() {
  const { state, toggleConnection, addMeasurement, reset, fields } = useSyncSimulation();

  return (
    <section>
      <h1 className="mb-1 font-headline text-2xl">Step 4 — sync reducer</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Plain buttons, no animation. Verifying the state machine before any motion exists.
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button type="button" onClick={toggleConnection} className={btn}>
          Toggle airplane mode
        </button>
        {fields.map(({ field, value }) => (
          <span key={field} className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => addMeasurement(field, -1)}
              disabled={!canStep(state, field, -1)}
              className={btn}
            >
              −
            </button>
            <span className="min-w-[9.5rem] text-center font-code text-sm">
              {field} {formatInches(value)}
              {INCH_MARK}
            </span>
            <button
              type="button"
              onClick={() => addMeasurement(field, 1)}
              disabled={!canStep(state, field, 1)}
              className={btn}
            >
              +
            </button>
          </span>
        ))}
        <button type="button" onClick={reset} className={btn}>
          Reset
        </button>
      </div>

      <dl className="mb-6 grid grid-cols-2 gap-x-6 gap-y-1 font-code text-sm sm:grid-cols-4">
        <dt className="text-muted-foreground">connection</dt>
        <dd>{state.connection}</dd>
        <dt className="text-muted-foreground">queue</dt>
        <dd>
          [{state.queue.join(', ')}] ({state.queue.length}/{MAX_QUEUE})
        </dd>
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
      <p className="mt-2 text-xs text-muted-foreground">
        Fields in template order: {MEASUREMENT_FIELDS.join(' · ')}
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Step 3 - frame, empty
 * ------------------------------------------------------------------ */

function FrameSmokeTest() {
  const [device, setDevice] = useState<DemoDevice>('phone');
  const [active, setActive] = useState<string | null>(null);

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
