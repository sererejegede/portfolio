'use client';

/**
 * Shared shell for the interactive project demos (brief §5).
 *
 * Owns everything that is *not* specific to a single demo: device chrome, the
 * annotation rail, the replay control, and the on-screen / reduced-motion
 * context that demos gate their timers and transitions on.
 *
 * Deliberately knows nothing about sync, or games, or calendars. A demo renders
 * its own screen as `children` and drives the rail by passing `activeAnnotationId`.
 * The frame is site-themed (portfolio tokens); anything inside the screen is the
 * demo's own visual world.
 */

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { annotationVariants } from './motion';

/* ------------------------------------------------------------------ *
 * Stage context
 * ------------------------------------------------------------------ */

export interface DemoStage {
  /**
   * True only when the demo is intersecting the viewport AND the tab is visible.
   * Gate every timer on this - nothing should tick in a background tab (brief §8).
   */
  isRunning: boolean;
  /** Visitor prefers reduced motion (brief §7). */
  reducedMotion: boolean;
}

const DemoStageContext = createContext<DemoStage>({
  isRunning: false,
  reducedMotion: false,
});

/** Read the stage from anywhere inside a `DemoFrame`. */
export function useDemoStage(): DemoStage {
  return useContext(DemoStageContext);
}

/**
 * Create the stage. A demo calls this itself and hands the result to
 * `DemoFrame`, rather than the frame owning it privately.
 *
 * The reason is ordering: a demo's simulation needs `isRunning` to gate its
 * timers, but the frame needs that same simulation's state to know which
 * annotation to show. If the frame owned the observer, the demo could only
 * reach it from inside the frame's own subtree - too late to compute the props
 * the frame is being given. Owning it here breaks the cycle with no magic.
 */
export function useDemoStageState(): {
  containerRef: RefObject<HTMLElement>;
  stage: DemoStage;
} {
  const containerRef = useRef<HTMLElement>(null);
  const [isOnScreen, setIsOnScreen] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);

  const prefersReduced = useReducedMotion();
  const reducedMotion = prefersReduced === true;

  // Pause when scrolled away. Any intersection counts as on-screen: a portrait
  // phone can be taller than a short viewport, so a fractional threshold would
  // never fire there.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setIsOnScreen(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => setIsOnScreen(entries.some((entry) => entry.isIntersecting)),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Intersection alone is not enough: a demo scrolled into view in a tab the
  // visitor has switched away from is still "intersecting".
  useEffect(() => {
    const readVisibility = () => setIsTabVisible(!document.hidden);
    readVisibility();
    document.addEventListener('visibilitychange', readVisibility);
    return () => document.removeEventListener('visibilitychange', readVisibility);
  }, []);

  const stage = useMemo<DemoStage>(
    () => ({ isRunning: isOnScreen && isTabVisible, reducedMotion }),
    [isOnScreen, isTabVisible, reducedMotion],
  );

  return { containerRef, stage };
}

/* ------------------------------------------------------------------ *
 * Props
 * ------------------------------------------------------------------ */

export type DemoDevice = 'phone' | 'browser';

export interface DemoAnnotation {
  id: string;
  text: string;
}

export interface DemoFrameProps {
  /** From `useDemoStageState`, which the demo owns. See the note on that hook. */
  stage: DemoStage;
  containerRef: RefObject<HTMLElement>;
  /** `phone` is portrait; `browser` is landscape with a title bar. */
  device: DemoDevice;
  /** Accessible name for the whole demo region. */
  label: string;
  /**
   * Every caption the demo can show, in beat order. The frame renders the full
   * set invisibly to reserve the tallest caption's height, so revealing one
   * causes no layout shift (brief §8).
   */
  annotations: readonly DemoAnnotation[];
  /** Which caption is currently revealed. `null` shows none. */
  activeAnnotationId?: string | null;
  /** Small label above the rail, e.g. "What just happened". */
  railTitle?: string;
  onReplay?: () => void;
  replayLabel?: string;
  /** URL text for the `browser` variant. Ignored by `phone`. */
  chromeLabel?: string;
  /** Anything the demo wants beneath the rail - controls, a legend, a live region. */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

/* ------------------------------------------------------------------ *
 * Component
 * ------------------------------------------------------------------ */

export default function DemoFrame({
  stage,
  containerRef,
  device,
  label,
  annotations,
  activeAnnotationId = null,
  railTitle,
  onReplay,
  replayLabel = 'Replay',
  chromeLabel,
  aside,
  children,
  className,
}: DemoFrameProps) {
  const activeAnnotation =
    annotations.find((annotation) => annotation.id === activeAnnotationId) ?? null;

  return (
    <DemoStageContext.Provider value={stage}>
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
            <PhoneChrome>{children}</PhoneChrome>
          ) : (
            <BrowserChrome chromeLabel={chromeLabel}>{children}</BrowserChrome>
          )}
        </div>

        <div className="w-full max-w-md justify-self-center lg:justify-self-start">
          {railTitle && (
            <p className="mb-3 font-code text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {railTitle}
            </p>
          )}

          <div className="relative">
            {/* Ghost layer: never seen, never announced. Its only job is to make
                the rail as tall as its tallest caption so revealing one cannot
                shift the page. Grid stacking gives us that for free. */}
            <div aria-hidden className="invisible grid">
              {annotations.map((annotation) => (
                <p
                  key={annotation.id}
                  className={cn(railCaptionClass, 'col-start-1 row-start-1')}
                >
                  {annotation.text}
                </p>
              ))}
            </div>

            <div className="absolute inset-0 grid">
              {/* Default (sync) mode, not `wait`: with `wait`, a caption going to
                  none has nothing to swap to, and the exiting node was left in
                  the DOM at opacity 0 — invisible, but still read by a screen
                  reader. Sync mode removes it, and crossfading the captions in
                  one grid cell is what §11.4 asks for anyway. */}
              <AnimatePresence initial={false}>
                {activeAnnotation && (
                  <motion.p
                    key={activeAnnotation.id}
                    variants={annotationVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className={cn(railCaptionClass, 'col-start-1 row-start-1')}
                  >
                    {activeAnnotation.text}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {aside && <div className="mt-6">{aside}</div>}

          {onReplay && (
            <button
              type="button"
              onClick={onReplay}
              className={cn(
                '-ml-2 mt-6 inline-flex items-center gap-2 rounded-md px-2 py-1',
                'font-code text-xs text-muted-foreground',
                'transition-colors hover:text-foreground',
                focusRingClass,
              )}
            >
              <RotateCcw aria-hidden className="h-3.5 w-3.5" />
              {replayLabel}
            </button>
          )}
        </div>
      </section>
    </DemoStageContext.Provider>
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

const railCaptionClass =
  'font-headline text-lg font-medium leading-snug text-foreground sm:text-xl';

/** One focus treatment, legible on both themes (brief §7). */
export const focusRingClass =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
