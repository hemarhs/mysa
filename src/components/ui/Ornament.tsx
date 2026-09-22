import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * The brand's small marks: eyebrow labels, hairline dividers, and the
 * diamond flourish that separates thoughts.
 *
 * These are pure server components — no state, no effects — so they cost
 * nothing on the client and can be dropped anywhere.
 */

type Tone = "dark" | "light";

/** Small uppercase label with a leading gold hairline. */
export function Eyebrow({
  children,
  tone = "dark",
  className,
  withRule = true,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  withRule?: boolean;
}) {
  return (
    <span
      className={cn(
        "eyebrow flex items-center gap-3.5",
        // Gold is not legible on cream at 11px, so the light variant uses the
        // darkened gold that clears WCAG AA at small sizes.
        tone === "dark" ? "text-gold" : "text-gold-ink",
        className
      )}
    >
      {withRule ? (
        <span
          className={cn(
            "block h-px w-10 shrink-0",
            tone === "dark" ? "bg-gold/55" : "bg-gold-ink/45"
          )}
          aria-hidden
        />
      ) : null}
      {children}
    </span>
  );
}

/** A hairline with a small diamond at its centre. Used between bands. */
export function Flourish({
  tone = "dark",
  className,
}: {
  tone?: Tone;
  className?: string;
}) {
  const line = tone === "dark" ? "bg-gold/35" : "bg-gold-ink/30";
  const mark = tone === "dark" ? "bg-gold" : "bg-gold-ink";

  return (
    <div
      className={cn("flex w-full items-center justify-center gap-4", className)}
      aria-hidden
    >
      <span className={cn("h-px flex-1 max-w-32", line)} />
      <span className={cn("block h-1.5 w-1.5 rotate-45", mark)} />
      <span className={cn("block h-1 w-1 rotate-45 opacity-60", mark)} />
      <span className={cn("block h-1.5 w-1.5 rotate-45", mark)} />
      <span className={cn("h-px flex-1 max-w-32", line)} />
    </div>
  );
}

/** Full-bleed tapered rule. */
export function Divider({ className }: { className?: string }) {
  return <div className={cn("rule-wide", className)} aria-hidden />;
}

/**
 * A numeral set as a catalogue plate number — 01, 02, 03. Small caps feel,
 * tabular figures, gold, with a hairline beneath.
 */
export function PlateNumber({
  value,
  tone = "dark",
  className,
}: {
  value: number;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex flex-col gap-2 font-sans text-[0.6875rem] font-semibold tracking-[0.2em] tnum",
        tone === "dark" ? "text-gold" : "text-gold-ink",
        className
      )}
      aria-hidden
    >
      {String(value).padStart(2, "0")}
      <span
        className={cn(
          "block h-px w-6",
          tone === "dark" ? "bg-gold/40" : "bg-gold-ink/35"
        )}
      />
    </span>
  );
}

/**
 * The corner brackets used on feature plates — four short gold rules that
 * suggest a frame without drawing a box.
 */
export function CornerFrame({ className }: { className?: string }) {
  const corner = "absolute h-6 w-6 border-gold/40";
  return (
    <span className={cn("pointer-events-none absolute inset-0", className)} aria-hidden>
      <span className={cn(corner, "left-0 top-0 border-l border-t")} />
      <span className={cn(corner, "right-0 top-0 border-r border-t")} />
      <span className={cn(corner, "bottom-0 left-0 border-b border-l")} />
      <span className={cn(corner, "bottom-0 right-0 border-b border-r")} />
    </span>
  );
}
