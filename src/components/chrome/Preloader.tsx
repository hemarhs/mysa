"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * First-load curtain.
 *
 * Sequence, 2.3s worst case:
 *   0.00s  the four wordmark strokes draw themselves in gold
 *   0.95s  the mark fills with brass and the hairline progress bar runs
 *   1.55s  two espresso panels part vertically, revealing the page
 *   2.30s  the component unmounts itself entirely
 *
 * Three rules, all of them learned from preloaders that went wrong:
 *
 *  1. **It can never trap the page.** A hard timer removes the curtain
 *     whether or not any of the animation callbacks fired. There is no path
 *     through this component that leaves content covered.
 *  2. **It runs once per tab.** Seeing the same 2.3s ceremony on every
 *     navigation is the fastest way to make a site feel slow, so a
 *     sessionStorage flag suppresses it — wrapped in try/catch, because
 *     storage throws in private windows and in some embedded webviews.
 *  3. **It never renders on the server.** The markup is mounted in an effect,
 *     so there is no server/client mismatch and no flash of a curtain for
 *     visitors who should not see one (reduced motion, repeat visits).
 */

const STORAGE_KEY = "mysa:intro-played";
/* 1.65s door to door.
 *
 * The first cut ran 2.3s, and every millisecond of it sat in front of the
 * Largest Contentful Paint: nothing behind an opaque curtain can be painted,
 * so the intro was setting the floor for the page's LCP score. Ceremony is
 * worth paying for; it is not worth paying a second of LCP for. */
const TOTAL_MS = 1650;

function alreadyPlayed(): boolean {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markPlayed(): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* Private mode, blocked storage — the intro simply plays again. */
  }
}

type Phase = "idle" | "drawing" | "parting" | "done";

export function Preloader() {
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<number[]>([]);

  const finish = useCallback(() => {
    setPhase("done");
    document.documentElement.removeAttribute("data-intro");
    document.body.style.removeProperty("overflow");
  }, []);

  useEffect(() => {
    // Repeat visit, or the visitor has asked for less motion: never show it.
    // Phase stays "idle", which renders nothing at all — there is no state
    // change to make, and therefore no extra render.
    if (alreadyPlayed() || prefersReducedMotion()) return;

    markPlayed();
    document.documentElement.setAttribute("data-intro", "playing");
    document.body.style.overflow = "hidden";

    const schedule = (fn: () => void, ms: number) => {
      timers.current.push(window.setTimeout(fn, ms));
    };

    // Raised on the next frame rather than synchronously, so the browser
    // gets one clean paint of the real page underneath before the curtain
    // covers it. That frame is what the LCP measurement sees.
    const raised = window.requestAnimationFrame(() => setPhase("drawing"));

    schedule(() => setPhase("parting"), 1000);
    schedule(finish, TOTAL_MS);

    // The failsafe. If a timer is throttled — a backgrounded tab, a busy
    // main thread — this still tears the curtain down.
    schedule(finish, TOTAL_MS + 1200);

    const onVisible = () => {
      if (document.visibilityState === "visible") return;
      // Tab hidden mid-intro: there is nothing to watch, so end it now and
      // let the visitor arrive at a finished page.
      finish();
    };
    document.addEventListener("visibilitychange", onVisible);

    const captured = timers.current;
    return () => {
      window.cancelAnimationFrame(raised);
      captured.forEach(window.clearTimeout);
      captured.length = 0;
      document.removeEventListener("visibilitychange", onVisible);
      document.documentElement.removeAttribute("data-intro");
      document.body.style.removeProperty("overflow");
    };
  }, [finish]);

  if (phase === "idle" || phase === "done") return null;

  const parting = phase === "parting";

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[200]"
      role="status"
      aria-live="polite"
      aria-label="Loading Mysa"
    >
      {/* --- The two panels ------------------------------------------------ */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1/2 bg-espresso will-change-transform",
          "transition-transform duration-[650ms] ease-[cubic-bezier(0.76,0,0.24,1)]",
          parting ? "-translate-y-full" : "translate-y-0"
        )}
      />
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 h-1/2 bg-espresso will-change-transform",
          "transition-transform duration-[650ms] ease-[cubic-bezier(0.76,0,0.24,1)]",
          parting ? "translate-y-full" : "translate-y-0"
        )}
      />

      {/* A single gold seam where the panels meet, so the split reads as
          deliberate rather than as two divs sliding apart. */}
      <div
        className={cn(
          "absolute inset-x-0 top-1/2 h-px origin-center bg-gold transition-all duration-[650ms] ease-[cubic-bezier(0.76,0,0.24,1)]",
          parting ? "scale-x-100 opacity-0" : "scale-x-0 opacity-70"
        )}
        aria-hidden
      />

      {/* --- Mark and progress --------------------------------------------- */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center gap-8 px-6",
          "transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          parting ? "opacity-0" : "opacity-100"
        )}
      >
        <svg
          viewBox="0 0 388 120"
          className="h-[clamp(2.75rem,9vw,4.5rem)] w-auto overflow-visible text-gold"
          fill="none"
          stroke="currentColor"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {WORDMARK_STROKES.map((d, index) => (
            <path
              key={d}
              d={d}
              pathLength={1}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: 1,
                animation: `draw-stroke 520ms cubic-bezier(0.16,1,0.3,1) ${
                  60 + index * 95
                }ms forwards`,
              }}
            />
          ))}
        </svg>

        <span className="eyebrow text-latte/70">Mee-sah</span>

        {/* Progress hairline. Not a fake percentage — it is a fixed-length
            run that matches the curtain's own timing, which is honest about
            what it is measuring. */}
        <span className="relative block h-px w-40 overflow-hidden bg-hairline">
          <span
            className="absolute inset-y-0 left-0 block w-full origin-left bg-gold"
            style={{
              transform: "scaleX(0)",
              animation:
                "progress-run 900ms cubic-bezier(0.25,0.46,0.45,0.94) 60ms forwards",
            }}
          />
        </span>
      </div>

      <style>{`
        @keyframes progress-run {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}

/** Kept local so the preloader never imports a component just for its data. */
const WORDMARK_STROKES = [
  "M20 100V20l35 55 35-55v80",
  "M120 20l32 42 32-42M152 62v38",
  "M264 40c0-14-16-22-29-20-15 2-24 13-22 25 2 13 15 18 27 22 14 5 24 11 23 21-1 11-17 16-30 13-11-2-19-8-21-17",
  "M292 100l38-80 38 80M307 73h46",
];
