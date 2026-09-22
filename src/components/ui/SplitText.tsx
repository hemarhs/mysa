"use client";

import { motion } from "framer-motion";
import { Fragment } from "react";

import { cn } from "@/lib/cn";
import { EASE_EXPO } from "@/lib/motion";

type Props = {
  /** One entry per visual line. Lines are revealed in sequence. */
  lines: readonly string[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  /** Seconds between each word. */
  stagger?: number;
  as?: "h1" | "h2" | "h3" | "p" | "div" | "span";
  /** Play on mount (the hero) rather than on scroll (everything else). */
  onMount?: boolean;
  /**
   * Words wrapped in _underscores_ are set in the display italic and tinted
   * gold — the one emphasis mechanism the brand has.
   */
  emphasis?: boolean;
};

type Word = { text: string; emphasised: boolean; order: number };

/**
 * Splits the lines into words and assigns each one its position in the whole
 * heading, so the stagger runs continuously across line breaks instead of
 * restarting on every line.
 *
 * Deliberately a module-level pure function rather than a counter mutated
 * inside the render: a variable that keeps incrementing across a `.map()` in
 * JSX is exactly the kind of render-time mutation that breaks under React's
 * compiler and concurrent rendering.
 */
function splitLines(lines: readonly string[], emphasis: boolean): Word[][] {
  let order = 0;
  return lines.map((line) =>
    line.split(" ").map((raw) => {
      const emphasised =
        emphasis && raw.length > 2 && raw.startsWith("_") && raw.endsWith("_");
      const word: Word = {
        text: emphasised ? raw.slice(1, -1) : raw,
        emphasised,
        order,
      };
      order += 1;
      return word;
    })
  );
}

const HIDDEN = { y: "108%", opacity: 0 };

/**
 * Word-by-word masked reveal — the site's signature type animation.
 *
 * Each line sits in an `overflow-hidden` box and its words rise into place,
 * which reads as typesetting rather than as a web effect. Splitting happens
 * at render time from a plain array of strings; nothing measures the DOM and
 * nothing rewrites `innerHTML`, so there is no flash of unstyled text.
 *
 * Accessibility: the visual word boxes are hidden from assistive technology
 * and the full sentence is supplied once via `aria-label`, so a screen reader
 * reads a heading rather than a list of fragments.
 */
export function SplitText({
  lines,
  className,
  lineClassName,
  delay = 0,
  stagger = 0.045,
  as: Tag = "h2",
  onMount = false,
  emphasis = true,
}: Props) {
  const structured = splitLines(lines, emphasis);
  const label = lines.join(" ").replace(/_/g, "");

  /* Reduced motion is handled in CSS, not here — see the note in Reveal.
   * Branching on `useReducedMotion()` renders different attributes on the
   * server and the client, which React reports as a hydration mismatch and
   * refuses to patch. The `[data-motion]` rule in globals.css pins these
   * words visible for anyone who has asked for less motion. */
  const animation = {
    initial: "hidden" as const,
    ...(onMount
      ? { animate: "visible" as const }
      : {
          whileInView: "visible" as const,
          viewport: { once: true, margin: "0px 0px -14% 0px" },
        }),
  };

  return (
    <Tag className={className} aria-label={label}>
      {structured.map((words, lineIdx) => (
        <span
          key={`line-${lineIdx}`}
          className={cn("block overflow-hidden", lineClassName)}
          aria-hidden
        >
          {words.map((word, idx) => (
            <Fragment key={`${word.text}-${word.order}`}>
              <motion.span
                data-motion
                className={cn(
                  "inline-block will-change-transform",
                  word.emphasised && "display-em text-gold"
                )}
                variants={{
                  hidden: HIDDEN,
                  visible: {
                    y: "0%",
                    opacity: 1,
                    transition: {
                      duration: 1.05,
                      delay: delay + word.order * stagger,
                      ease: EASE_EXPO,
                    },
                  },
                }}
                {...animation}
              >
                {word.text}
              </motion.span>
              {idx < words.length - 1 ? " " : null}
            </Fragment>
          ))}
        </span>
      ))}
    </Tag>
  );
}
