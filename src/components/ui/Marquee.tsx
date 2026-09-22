"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

type Props = {
  items: readonly string[];
  /** Seconds for one full pass. Higher is slower. */
  duration?: number;
  className?: string;
  tone?: "dark" | "light";
  /** Reverses direction — two stacked marquees running opposite read richer. */
  reverse?: boolean;
};

/**
 * A slow band of repeating phrases between sections, set at low contrast so
 * it reads as texture rather than as a headline competing for attention.
 *
 * Driven by a CSS animation on a duplicated track rather than by JavaScript:
 * the browser can run it off the main thread, it costs nothing while
 * off-screen, and `prefers-reduced-motion` stops it with a single rule
 * instead of a React branch.
 *
 * It pauses itself when scrolled out of view. A marquee animating below the
 * fold is pure battery drain on a laptop.
 */
export function Marquee({
  items,
  duration = 52,
  className,
  tone = "dark",
  reverse = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "120px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Two copies so the -50% loop is seamless.
  const track = [...items, ...items];
  const dark = tone === "dark";

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden border-y py-6",
        dark
          ? "border-hairline bg-gradient-to-b from-roast/55 via-espresso to-void/70"
          : "border-hairline-ink bg-gradient-to-b from-white/60 via-cream to-cream-dim/70",
        className
      )}
      aria-hidden
    >
      {/* Feathered edges, so phrases fade out rather than getting clipped. */}
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r to-transparent md:w-32",
          dark ? "from-espresso" : "from-cream"
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l to-transparent md:w-32",
          dark ? "from-espresso" : "from-cream"
        )}
      />

      <div
        className="flex w-max items-center gap-10 whitespace-nowrap will-change-transform"
        style={{
          animationName: "marquee-run",
          animationDuration: `${duration}s`,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          animationDirection: reverse ? "reverse" : "normal",
          animationPlayState: visible ? "running" : "paused",
        }}
      >
        {track.map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center gap-10">
            <span
              className={cn(
                "font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.3em]",
                dark ? "text-latte/60" : "text-mocha/70"
              )}
            >
              {item}
            </span>
            <span
              className={cn(
                "block h-1 w-1 rotate-45",
                dark ? "bg-gold/50" : "bg-gold-ink/45"
              )}
            />
          </span>
        ))}
      </div>

      <style>{`
        @keyframes marquee-run {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="marquee-run"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
