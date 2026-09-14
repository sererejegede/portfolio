'use client';

/**
 * Word Twist — the live game, embedded and playable.
 *
 * Deliberately NOT built on `DemoFrame`. Tailor's Ledger needed a simulation;
 * Word Twist is already a game, so the honest demo is the game itself in an
 * iframe. Checked against the real source, DemoFrame fought it on every axis:
 *
 *   - Height. The game card needs roughly 440px (summed from its Tailwind
 *     classes) plus 32px of page padding. The frame's 16:10 browser variant
 *     leaves 312px at desktop and ~172px at a 390px viewport.
 *   - The annotation rail. A cross-origin iframe cannot report game state, so
 *     there is nothing for captions to follow — and without a rail the frame's
 *     two-column grid would strand the game beside an empty column.
 *   - Cost. The frame's stage hook imports Framer Motion; this animates nothing.
 *
 * CLICK TO PLAY. The game starts its clock the moment its page loads and scores
 * each word as `max(10, 100 - seconds)` by wall-clock time, which a parent page
 * cannot pause across origins. So nothing loads until the visitor presses Play:
 * every word is scored fairly, nothing runs off-screen (brief §8), and the
 * iframe costs the portfolio's first load nothing until someone opts in.
 *
 * The placeholder and the iframe occupy the same fixed box, so the swap cannot
 * shift the page.
 */

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ExternalLink, Loader2, Play, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import WordTwistScreenshot from '@/assets/word-twist.png';

export const WORD_TWIST_URL = 'https://word-twist.sererejegede.dev';

/**
 * Tall enough for the whole game card with no internal scrolling, with ~70px of
 * slack over the ~472px estimate. Width follows the container up to 560px; the
 * card itself tops out at 448px, so anything wider is only margin.
 */
const EMBED_BOX = 'h-[540px] w-full';

/**
 * The game's own page background, from its globals.css (`:root --background:
 * 0 0% 11.8%`, i.e. #1E1E1E). Word Twist has no light theme — no ThemeProvider,
 * no `.dark` block — so the iframe is always this colour. Painting the idle and
 * loading states to match means pressing Play does not flash a white card to
 * dark grey in the portfolio's light mode, and the box previews the game.
 */
const GAME_BACKGROUND = 'bg-[#1E1E1E]';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const quietControl = cn(
  'inline-flex items-center gap-1.5 rounded-sm text-muted-foreground transition-colors hover:text-foreground',
  focusRing,
);

export default function WordTwistEmbed({ className }: { className?: string }) {
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  // Set only by End game, so focus returns to Play after an explicit end but is
  // never pulled there on first render.
  const returnFocusToPlay = useRef(false);

  const play = () => {
    setLoaded(false);
    setPlaying(true);
  };

  /**
   * There is deliberately no restart control: Word Twist already offers its own
   * "Play Again" at the end of every game. What the page can add is a way OUT.
   * Unmounting the iframe is the only way to stop the game's clock from outside,
   * since a cross-origin page cannot be paused. Ending returns to the Play state,
   * and pressing Play again loads a genuinely fresh game.
   */
  const end = () => {
    returnFocusToPlay.current = true;
    setPlaying(false);
  };

  useEffect(() => {
    if (!playing && returnFocusToPlay.current) {
      returnFocusToPlay.current = false;
      // The End button that held focus has just unmounted along with the game.
      playButtonRef.current?.focus();
    }
  }, [playing]);

  return (
    <div className={cn('w-full max-w-[560px]', className)}>
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border border-border shadow-lg',
          GAME_BACKGROUND,
          EMBED_BOX,
        )}
      >
        {playing ? (
          <>
            <iframe
              src={WORD_TWIST_URL}
              title="Word Twist, a playable word game"
              className="h-full w-full"
              // Same-origin is kept so the game's own scripts and requests behave
              // exactly as they do on its own domain. Together with allow-scripts
              // that would let a framed page lift its own sandbox, which matters
              // for untrusted content — this is the portfolio owner's own site.
              sandbox="allow-scripts allow-same-origin allow-forms"
              onLoad={(event) => {
                setLoaded(true);
                // The Play button that held focus is gone. Hand focus to the game
                // so a keyboard user is not dropped back at the top of the page.
                event.currentTarget.focus({ preventScroll: true });
              }}
            />
            {!loaded && (
              <div
                role="status"
                className={cn(
                  'absolute inset-0 flex flex-col items-center justify-center gap-3',
                  GAME_BACKGROUND,
                )}
              >
                <Loader2
                  aria-hidden
                  className="h-8 w-8 animate-spin text-primary motion-reduce:animate-none"
                />
                <span className="text-sm text-white/70">Loading Word Twist…</span>
              </div>
            )}
          </>
        ) : (
          <>
            {/* The real screenshot, dimmed, so the idle box reads as the game
                rather than an empty rectangle. Decorative: alt is empty. */}
            <Image
              src={WordTwistScreenshot}
              alt=""
              fill
              sizes="560px"
              className="object-contain opacity-25"
            />
            <div className="relative flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
              <button
                ref={playButtonRef}
                type="button"
                onClick={play}
                className={cn(
                  'inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground shadow-md transition-colors hover:bg-primary/90',
                  focusRing,
                  // The box is always dark, so offset the ring against it rather
                  // than against the page background it would otherwise use.
                  'focus-visible:ring-offset-[#1E1E1E]',
                )}
              >
                <Play aria-hidden className="h-4 w-4" />
                Play Word Twist
              </button>
              {/* Always on the game's dark ground, so theme-independent text. */}
              <p className="text-sm text-white/70">The clock starts when you press Play.</p>
            </div>
          </>
        )}
      </div>

      {/* The link is always present, so End game appearing beside it while a
          game is running changes nothing about this row's height. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {playing && (
          <button type="button" onClick={end} className={quietControl}>
            <Square aria-hidden className="h-3.5 w-3.5" />
            End game
          </button>
        )}
        <a
          href={WORD_TWIST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={quietControl}
        >
          Open full page
          <ExternalLink aria-hidden className="h-3.5 w-3.5" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </div>
  );
}
