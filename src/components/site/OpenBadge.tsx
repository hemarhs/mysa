import { cn } from "@/lib/cn";

/**
 * "Open now" / "Closed" with a small pulsing dot.
 *
 * One component rather than the same nine lines repeated on the home page
 * and the contact page — the two had already drifted apart once.
 *
 * The pulse is a ring that scales and fades on a long, slow curve, so it
 * reads as a lit sign rather than a notification badge. It stops entirely
 * under prefers-reduced-motion, leaving a static dot.
 */
export function OpenBadge({
  open,
  tone = "dark",
  className,
}: {
  open: boolean;
  tone?: "dark" | "light";
  className?: string;
}) {
  const on = tone === "dark" ? "text-gold" : "text-gold-ink";
  const off = tone === "dark" ? "text-latte/70" : "text-mocha/70";
  const dotOn = tone === "dark" ? "bg-gold" : "bg-gold-ink";
  const dotOff = tone === "dark" ? "bg-latte/40" : "bg-mocha/35";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.16em]",
        open ? on : off,
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
        {open ? (
          <span
            className={cn(
              "absolute inset-0 rounded-full opacity-60 motion-safe:animate-[open-pulse_2.8s_cubic-bezier(0.25,0.46,0.45,0.94)_infinite]",
              dotOn
            )}
          />
        ) : null}
        <span className={cn("relative block h-1.5 w-1.5 rounded-full", open ? dotOn : dotOff)} />
      </span>
      {open ? "Open now" : "Closed now"}
      <style>{`
        @keyframes open-pulse {
          0%   { transform: scale(1);   opacity: 0.6; }
          70%  { transform: scale(3.4); opacity: 0; }
          100% { transform: scale(3.4); opacity: 0; }
        }
      `}</style>
    </span>
  );
}
