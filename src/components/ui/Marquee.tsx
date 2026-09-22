"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/cn";

type Props = {
  items: string[];
  /** Seconds for one full pass. Higher is slower. */
  duration?: number;
  className?: string;
  tone?: "dark" | "linen";
};

/**
 * A slow band of repeating phrases between sections. Kept to one line, at low
 * contrast, so it reads as texture rather than as a headline competing for
 * attention.
 */
export function Marquee({ items, duration = 48, className, tone = "dark" }: Props) {
  const reduced = useReducedMotion();
  // Two copies so the loop is seamless at -50%.
  const track = [...items, ...items];

  return (
    <div
      className={cn(
        "relative overflow-hidden border-y py-6",
        tone === "dark" ? "border-hairline bg-roast/40" : "border-hairline-ink bg-linen-deep/50",
        className
      )}
      aria-hidden
    >
      {/* Feathered edges, so phrases fade out rather than getting clipped. */}
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r to-transparent",
          tone === "dark" ? "from-espresso" : "from-linen"
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l to-transparent",
          tone === "dark" ? "from-espresso" : "from-linen"
        )}
      />

      <motion.div
        className="flex w-max items-center gap-10 whitespace-nowrap"
        animate={reduced ? {} : { x: ["0%", "-50%"] }}
        transition={reduced ? {} : { duration, repeat: Infinity, ease: "linear" }}
      >
        {track.map((item, index) => (
          <span key={index} className="flex items-center gap-10">
            <span
              className={cn(
                "font-sans text-[0.6875rem] font-medium uppercase tracking-[0.28em]",
                tone === "dark" ? "text-cream-muted/55" : "text-ink-muted/60"
              )}
            >
              {item}
            </span>
            <span
              className={cn(
                "block h-1 w-1 rotate-45",
                tone === "dark" ? "bg-gold/45" : "bg-gold-dim/45"
              )}
            />
          </span>
        ))}
      </motion.div>
    </div>
  );
}
