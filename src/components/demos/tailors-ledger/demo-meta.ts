/**
 * The handful of constants the loading skeleton needs before the demo itself
 * has downloaded.
 *
 * These live apart from `OfflineSyncDemo` on purpose: if the skeleton imported
 * them from there, the whole demo module — Framer Motion included — would be
 * pulled into the initial bundle and the `next/dynamic` split would buy nothing.
 * This file is a few hundred bytes and imports nothing.
 */

import type { DemoAnnotation } from '../frame-shell';

export const RAIL_TITLE = 'What just happened';

/** The captions, in beat order. The rail sizes itself to the longest of these. */
export const ANNOTATIONS: readonly DemoAnnotation[] = [
  { id: 'offline', text: 'Connection lost — the app does not care' },
  { id: 'written', text: 'Written to on-device SQLite' },
  { id: 'queued', text: '3 changes queued · nothing is lost' },
  { id: 'pushing', text: 'Pushing to Postgres · last-write-wins' },
  { id: 'in-sync', text: 'In sync' },
];
