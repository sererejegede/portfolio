/**
 * Shared transition presets for the interactive project demos.
 *
 * Every demo imports from here rather than inlining durations, so motion stays
 * consistent across Tailor's Ledger, Word Twist and whatever follows. If a number
 * needs tuning, it gets tuned once, here.
 *
 * House rules (brief §6):
 *   - Nothing runs longer than 400ms.
 *   - Nothing bouncy on a colour change — springs are for position and scale only.
 *   - Only `transform` and `opacity` animate. Anything that genuinely changes size
 *     or position uses Framer Motion's `layout` prop, never animated width/height/top/left.
 */

import type { Transition, Variants } from 'motion/react';

/* ------------------------------------------------------------------ *
 * Primitives
 * ------------------------------------------------------------------ */

/** Switch thumb, and anything else that should feel physically thrown. */
export const springThumb: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
  mass: 0.6,
};

/** Queue badge pop. Slightly softer than the thumb so the overshoot reads as a beat. */
export const springBadge: Transition = {
  type: 'spring',
  stiffness: 520,
  damping: 22,
  mass: 0.5,
};

/** Colour and text crossfades. Deliberately not a spring. */
export const easeColor: Transition = {
  duration: 0.24,
  ease: [0.32, 0.72, 0, 1],
};

/** Row inserts and other short entrances. */
export const easeEnter: Transition = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1],
};

/** Exits are quicker than entrances — leaving should not hold the eye. */
export const easeExit: Transition = {
  duration: 0.16,
  ease: 'easeIn',
};

/** The pending ring collapsing before the check draws. */
export const easeRingCollapse: Transition = {
  duration: 0.16,
  ease: 'easeIn',
};

/** `stroke-dashoffset` sweep for the synced check. */
export const easeCheckDraw: Transition = {
  duration: 0.2,
  ease: 'easeOut',
};

/* ------------------------------------------------------------------ *
 * Timing constants (used by the simulation, not by Framer Motion)
 * ------------------------------------------------------------------ */

/** Gap between successive queue items draining, in ms (brief §6: 220–280ms). */
export const DRAIN_INTERVAL_MS = 250;

/** Idle delay before the airplane switch pulses its one-time hint, in ms. */
export const IDLE_HINT_DELAY_MS = 3000;

/* --- Scripted measurement playback ---------------------------------- *
 * The visitor does not enter measurements; the demo plays them back. These
 * three numbers set that pace. Commit-to-commit is GAP + FOCUS = 780ms, which
 * reads as deliberate entry rather than three values blurring into one event.
 */

/** Flipping to offline, to the first row lighting up. Lets the pill land first. */
export const SCRIPT_LEAD_IN_MS = 400;

/**
 * How long a row stays lit before its new value commits. Deliberately longer
 * than the 250ms first tried: at that speed the highlight registered as a
 * flicker rather than as someone pausing on a field.
 */
export const SCRIPT_FOCUS_MS = 330;

/** From one value committing to the next row lighting up. */
export const SCRIPT_GAP_MS = 450;

/* ------------------------------------------------------------------ *
 * Variants
 * ------------------------------------------------------------------ */

/**
 * Pill label swap — crossfade in place, no slide.
 *
 * There is no `pillVariants` companion to this on purpose. The pill has no
 * transform to animate: its colour is a token swap that CSS transitions over
 * `easeColor`'s duration, and its width change is handled by Framer Motion's
 * `layout` prop rather than an animated `width`, which would thrash layout every
 * frame (brief §6). All that is left for a variant to do is this crossfade.
 */
export const pillLabelVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: easeColor },
  exit: { opacity: 0, transition: easeExit },
};

/**
 * A change row arriving in the list. It slides in from the leading edge rather
 * than dropping from above: the list grows downward, so a row falling INTO the
 * position it was going to occupy anyway read as a stutter. Coming from the
 * side keeps the entrance clear of the layout shift the insert itself causes.
 */
export const rowVariants: Variants = {
  initial: { opacity: 0, x: -14 },
  animate: { opacity: 1, x: 0, transition: easeEnter },
  exit: { opacity: 0, transition: easeExit },
};

/** Queue badge: pops in, pops on increment, fades out at zero. */
export const badgeVariants: Variants = {
  initial: { opacity: 0, scale: 0.6 },
  animate: { opacity: 1, scale: 1, transition: springBadge },
  bump: { scale: [1, 1.18, 1], transition: { duration: 0.22, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.6, transition: easeExit },
};

/**
 * Beat 0's one-time hint (brief §4): after a few idle seconds the switch pulses
 * ONCE. This is the only attract behaviour in the demo — autoplaying the whole
 * sequence would steal the discovery moment the demo exists for.
 */
export const hintPulseVariants: Variants = {
  rest: { scale: 1 },
  pulse: {
    scale: [1, 1.12, 1],
    transition: { duration: 0.36, ease: 'easeOut', times: [0, 0.45, 1] },
  },
};

/** Annotation rail caption. Fade only — the brief is explicit: fade, do not slide. */
export const annotationVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.24, ease: 'easeOut' } },
  exit: { opacity: 0, transition: easeExit },
};

/* ------------------------------------------------------------------ *
 * Reduced motion
 * ------------------------------------------------------------------ */

/**
 * The reduced-motion path keeps sequencing and drops transforms (brief §7): the
 * queue still drains one item at a time, but nothing slides, scales or draws.
 * Wrap any variant set with this before handing it to a `motion` component.
 */
export function withoutTransforms(variants: Variants): Variants {
  const stripped: Variants = {};
  for (const [name, variant] of Object.entries(variants)) {
    if (typeof variant !== 'object' || variant === null) {
      stripped[name] = variant;
      continue;
    }
    const { x, y, scale, scaleX, scaleY, rotate, pathLength, ...rest } =
      variant as Record<string, unknown>;
    stripped[name] = { ...rest, transition: { duration: 0 } };
  }
  return stripped;
}

/** Instant transition for the reduced-motion path. */
export const instant: Transition = { duration: 0 };
