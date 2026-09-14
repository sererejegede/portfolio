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
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { annotationVariants } from './motion';
import { FrameShell, focusRingClass, railCaptionClass, replayClass } from './frame-shell';
import type { DemoAnnotation, DemoDevice } from './frame-shell';

export { DemoFrameSkeleton, focusRingClass, FrameShell } from './frame-shell';
export type { DemoAnnotation, DemoDevice } from './frame-shell';

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

  // `useReducedMotionConfig` rather than `useReducedMotion`: it honours the OS
  // preference exactly the same way, but also lets an enclosing `<MotionConfig
  // reducedMotion>` force it — which is what makes the §7 path testable without
  // asking a reviewer to change their system settings.
  const reducedMotion = useReducedMotionConfig() === true;

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
      <FrameShell
        containerRef={containerRef}
        label={label}
        device={device}
        chromeLabel={chromeLabel}
        className={className}
        railTitle={railTitle}
        annotations={annotations}
        screen={children}
        aside={aside}
        replay={
          onReplay && (
            <button
              type="button"
              onClick={onReplay}
              className={cn(replayClass, 'transition-colors hover:text-foreground', focusRingClass)}
            >
              <RotateCcw aria-hidden className="h-3.5 w-3.5" />
              {replayLabel}
            </button>
          )
        }
      >
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
      </FrameShell>
    </DemoStageContext.Provider>
  );
}

