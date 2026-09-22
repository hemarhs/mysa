import { cn } from "@/lib/cn";

/**
 * MYSA, drawn as four monoline letterforms rather than set in a typeface.
 *
 * Drawing it as geometry buys two things a <span> cannot: the preloader can
 * animate the strokes as if the name were being written, and the mark stays
 * pin-sharp at any size without shipping a font weight nobody else uses.
 *
 * Every path carries `pathLength="1"`, which normalises stroke maths — the
 * draw-on animation is `stroke-dasharray: 1; stroke-dashoffset: 1 → 0` with
 * no JavaScript measurement, so it cannot desynchronise.
 */

export const WORDMARK_PATHS = [
  // M
  "M20 100V20l35 55 35-55v80",
  // Y
  "M120 20l32 42 32-42M152 62v38",
  // S — redrawn so it sits on the same baseline as its neighbours and
  // tucks in close to the Y. The first cut descended 13 units below the
  // baseline and left a 42-unit gap, which read as "MY SA".
  "M264 40c0-14-16-22-29-20-15 2-24 13-22 25 2 13 15 18 27 22 14 5 24 11 23 21-1 11-17 16-30 13-11-2-19-8-21-17",
  // A
  "M292 100l38-80 38 80M307 73h46",
] as const;

type Props = {
  className?: string;
  /** Rendered into the accessible name; hidden from the mark itself. */
  title?: string;
};

export function Wordmark({ className, title = "Mysa" }: Props) {
  return (
    <svg
      viewBox="0 0 388 120"
      role="img"
      aria-label={title}
      className={cn("block h-[1.15em] w-auto overflow-visible", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {WORDMARK_PATHS.map((d) => (
        <path key={d} d={d} pathLength={1} />
      ))}
    </svg>
  );
}

/**
 * The lockup used in the header and footer: the mark, a hairline, and the
 * pronunciation set small. Kept as its own component so the two never drift.
 */
export function WordmarkLockup({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Wordmark className="h-[0.95rem] text-current" />
      <span className="h-4 w-px bg-current opacity-25" aria-hidden />
      <span
        className="font-sans text-[0.5625rem] font-semibold uppercase tracking-[0.24em] opacity-70"
        aria-hidden
      >
        Est. 2019
      </span>
    </span>
  );
}
