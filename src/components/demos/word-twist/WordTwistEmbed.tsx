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
 * NO PLAY GATE. This used to hide the iframe behind a Play button, because the
 * game started its clock the moment its page loaded. Since word-twist 09b7b28
 * ("start on click") the game waits on its own start screen, so a portfolio
 * Play button would only be a second Play in front of the first. The End game
 * control went with it: it existed to stop that clock and return to Play.
 *
 * The iframe is still lazy. It sits well below the fold, and `loading="lazy"`
 * keeps every portfolio visit from fetching a whole second Next.js app until
 * the visitor scrolls near it.
 */

import { useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
 * no `.dark` block — so the iframe is always this colour. Painting the box and
 * its loading state to match means no white card flashes to dark grey in the
 * portfolio's light mode.
 */
const GAME_BACKGROUND = 'bg-[#1E1E1E]';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const quietControl = cn(
  'inline-flex items-center gap-1.5 rounded-sm text-muted-foreground transition-colors hover:text-foreground',
  focusRing,
);

export default function WordTwistEmbed({ className }: { className?: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn('w-full max-w-[560px]', className)}>
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border border-border shadow-lg',
          GAME_BACKGROUND,
          EMBED_BOX,
        )}
      >
        <iframe
          src={WORD_TWIST_URL}
          title="Word Twist, a playable word game"
          className="h-full w-full"
          loading="lazy"
          // Same-origin is kept so the game's own scripts and requests behave
          // exactly as they do on its own domain. Together with allow-scripts
          // that would let a framed page lift its own sandbox, which matters
          // for untrusted content — this is the portfolio owner's own site.
          sandbox="allow-scripts allow-same-origin allow-forms"
          // Focus is deliberately NOT moved into the game on load. With no Play
          // click to hand it over, that would yank focus into a below-the-fold
          // iframe the moment it finished loading.
          onLoad={() => setLoaded(true)}
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
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
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
