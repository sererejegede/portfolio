'use client';

/**
 * Deferred entry point for the Tailor's Ledger demo (brief §8).
 *
 * The demo sits well below the fold and pulls in Framer Motion, so none of it
 * should compete with the page's first paint. `next/dynamic` with `ssr: false`
 * splits it into its own chunk that is only requested on the client.
 *
 * While that chunk is in flight, `DemoFrameSkeleton` holds the exact space the
 * demo will occupy — it renders the same `FrameShell`, so the two cannot drift
 * apart. Deferring the chunk would be a poor trade if the swap shunted the page.
 */

import dynamic from 'next/dynamic';
// Straight from the shell, NOT via DemoFrame — DemoFrame imports Framer
// Motion, so re-exporting the skeleton through it would drag the library back
// into the initial bundle and undo the split entirely.
import { DemoFrameSkeleton } from '../frame-shell';
import { ANNOTATIONS, RAIL_TITLE } from './demo-meta';
import './tokens.css';

const OfflineSyncDemo = dynamic(() => import('./OfflineSyncDemo'), {
  ssr: false,
  loading: () => (
    <DemoFrameSkeleton
      device="phone"
      annotations={ANNOTATIONS}
      railTitle={RAIL_TITLE}
      // `.tl-demo` is imported here too, so the placeholder screen is the app's
      // own paper rather than a grey rectangle that then flashes to warm white.
      screenClassName="tl-demo bg-[var(--tl-screen)]"
    />
  ),
});

export default function LazyOfflineSyncDemo() {
  return <OfflineSyncDemo />;
}
