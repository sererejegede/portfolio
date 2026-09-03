/**
 * The demo frame's layout, device chrome and loading skeleton.
 *
 * Split out of `DemoFrame` and deliberately free of any `motion/react` import.
 * The skeleton renders while the demo's own chunk is still downloading, so
 * everything this file touches lands in the initial bundle. Importing Framer
 * Motion here pulled ~46kB into first load and made the `next/dynamic` split
 * pointless — which is exactly what happened before this was separated.
 */

import type { ReactNode, RefObject } from 'react';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DemoDevice = 'phone' | 'browser';

export interface DemoAnnotation {
  id: string;
  text: string;
}

/**
 * The frame's layout, shared by the live frame and its loading skeleton.
 *
 * Extracted rather than duplicated so the two cannot drift: `next/dynamic`
 * swaps one for the other, and any height difference between them would show up
 * as layout shift the moment the chunk lands (brief §8).
 */
export function FrameShell({
  containerRef,
  label,
  device,
  chromeLabel,
  className,
  railTitle,
  annotations,
  screen,
  aside,
  replay,
  children,
}: {
  containerRef?: RefObject<HTMLElement>;
  label?: string;
  device: DemoDevice;
  chromeLabel?: string;
  className?: string;
  railTitle?: string;
  annotations: readonly DemoAnnotation[];
  screen: ReactNode;
  aside?: ReactNode;
  replay?: ReactNode;
  /** The live caption layer, absolutely positioned over the ghost rail. */
  children?: ReactNode;
}) {
  return (
    <section
      ref={containerRef}
      aria-label={label}
      className={cn(
        'grid items-center gap-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-12',
        className,
      )}
    >
      <div className="justify-self-center">
        {device === 'phone' ? (
          <PhoneChrome>{screen}</PhoneChrome>
        ) : (
          <BrowserChrome chromeLabel={chromeLabel}>{screen}</BrowserChrome>
        )}
      </div>

      <div className="w-full max-w-md justify-self-center lg:justify-self-start">
        {railTitle && <p className={railTitleClass}>{railTitle}</p>}

        <div className="relative">
          {/* Ghost layer: never seen, never announced. Its only job is to make
              the rail as tall as its tallest caption so revealing one cannot
              shift the page. Grid stacking gives us that for free. */}
          <div aria-hidden className="invisible grid">
            {annotations.map((annotation) => (
              <p key={annotation.id} className={cn(railCaptionClass, 'col-start-1 row-start-1')}>
                {annotation.text}
              </p>
            ))}
          </div>
          {children}
        </div>

        {aside && <div className="mt-6">{aside}</div>}
        {replay}
      </div>
    </section>
  );
}

/**
 * Placeholder shown while the demo's JavaScript is still downloading.
 *
 * Renders the identical shell, so it occupies exactly the space the real demo
 * will — the whole point of deferring the chunk is lost if the swap moves the
 * page. The screen is a plain fill in the demo's own background token.
 */
export function DemoFrameSkeleton({
  device,
  annotations,
  railTitle,
  screenClassName,
  className,
}: {
  device: DemoDevice;
  annotations: readonly DemoAnnotation[];
  railTitle?: string;
  /** Paints the dark screen in the demo's own colour rather than a grey box. */
  screenClassName?: string;
  className?: string;
}) {
  return (
    <div aria-hidden>
      <FrameShell
        device={device}
        annotations={annotations}
        railTitle={railTitle}
        className={className}
        screen={<div className={cn('h-full w-full', screenClassName)} />}
        aside={
          // Same height as the real airplane-switch row.
          <div className="flex items-center gap-3">
            <span className="h-6 w-11 shrink-0 rounded-full bg-muted" />
            <span className="text-sm text-transparent">Airplane mode</span>
          </div>
        }
        replay={
          <span className={cn(replayClass, 'text-transparent')}>
            <RotateCcw aria-hidden className="h-3.5 w-3.5 opacity-0" />
            Replay
          </span>
        }
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Chrome
 * ------------------------------------------------------------------ */

/**
 * Portrait handset. Tailor's Ledger is a mobile app used only in portrait, so
 * the aspect ratio is fixed rather than responsive - the frame scales, it does
 * not rotate.
 */
function PhoneChrome({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        'relative aspect-[318/652] w-[clamp(258px,76vw,318px)]',
        'rounded-[42px] border-[10px] border-[#15140f] dark:border-[#0a0907]',
        'ring-1 ring-black/10 dark:ring-white/10',
        'shadow-[0_24px_60px_-28px_rgba(20,18,12,0.55)] dark:shadow-[0_24px_60px_-28px_rgba(0,0,0,0.8)]',
      )}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[32px]">{children}</div>
      {/* Decorative only - the screen beneath is real DOM (brief §7). */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1.5 h-[5px] w-20 -translate-x-1/2 rounded-full bg-black/25 dark:bg-white/15"
      />
    </div>
  );
}

/** Landscape browser window, for Word Twist and anything else desktop-shaped. */
function BrowserChrome({
  chromeLabel,
  children,
}: {
  chromeLabel?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'relative aspect-[16/10] w-[clamp(280px,86vw,560px)] overflow-hidden',
        'rounded-xl border border-border bg-card',
        'shadow-[0_24px_60px_-28px_rgba(20,18,12,0.45)] dark:shadow-[0_24px_60px_-28px_rgba(0,0,0,0.8)]',
      )}
    >
      <div
        aria-hidden
        className="flex h-9 items-center gap-2 border-b border-border bg-muted/40 px-3"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
        {chromeLabel && (
          <span className="ml-2 truncate rounded-full bg-background px-3 py-0.5 font-code text-[10px] text-muted-foreground">
            {chromeLabel}
          </span>
        )}
      </div>
      <div className="relative h-[calc(100%-2.25rem)] w-full overflow-hidden">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Shared class fragments
 * ------------------------------------------------------------------ */

export const railCaptionClass =
  'font-headline text-lg font-medium leading-snug text-foreground sm:text-xl';

export const railTitleClass =
  'mb-3 font-code text-[10px] uppercase tracking-[0.16em] text-muted-foreground';

/** Shared by the real Replay button and the skeleton's stand-in for it. */
export const replayClass =
  '-ml-2 mt-6 inline-flex items-center gap-2 rounded-md px-2 py-1 font-code text-xs text-muted-foreground';

/** One focus treatment, legible on both themes (brief §7). */
export const focusRingClass =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
