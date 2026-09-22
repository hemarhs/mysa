"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

import { DURATION, EASE_EXPO } from "@/lib/motion";

type RevealDirection = "up" | "down" | "left" | "right" | "none";

type RevealProps = {
  children: ReactNode;
  /** Stagger position within a group, in seconds. */
  delay?: number;
  /** Distance travelled on entry, in pixels. */
  distance?: number;
  direction?: RevealDirection;
  /** Adds a gentle scale, used on images and cards. */
  scale?: boolean;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "header" | "figure" | "aside" | "ul";
};

/**
 * The site's entrance primitive. Content rises a short distance and fades in
 * as it enters the viewport, once, on a long expo curve.
 *
 * `data-motion` is on the rendered element so the global reduced-motion rule
 * in globals.css can force it to its final state — belt and braces alongside
 * the reduced-motion CSS rule, because a visitor can enable the preference
 * after the page has already rendered.
 */
export function Reveal({
  children,
  delay = 0,
  distance = 26,
  direction = "up",
  scale = false,
  className,
  as = "div",
}: RevealProps) {
  // The union of every motion.* component collapses to `never` when indexed,
  // so it is narrowed to one concrete signature here. All the variants share
  // the prop shape this component uses.
  const Component = motion[as] as typeof motion.div;

  /* No `useReducedMotion()` branch here, deliberately.
   *
   * That hook returns false on the server and the real preference on the
   * client, so branching on it produced different markup in each — React
   * reported a hydration mismatch on every page for reduced-motion visitors,
   * and warned that it would not patch the attributes up.
   *
   * The preference is honoured in CSS instead: the global
   * `@media (prefers-reduced-motion: reduce)` rule in globals.css pins every
   * `[data-motion]` element to `opacity: 1` and `transform: none` with
   * `!important`, which beats framer-motion's inline styles. Same markup on
   * both sides, and content can never be left invisible. */
  const offset = {
    x: direction === "left" ? distance : direction === "right" ? -distance : 0,
    y: direction === "up" ? distance : direction === "down" ? -distance : 0,
  };

  const variants: Variants = {
    hidden: {
      opacity: 0,
      ...offset,
      scale: scale ? 0.985 : 1,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: { duration: DURATION.slow, delay, ease: EASE_EXPO },
    },
  };

  return (
    <Component
      data-motion
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
    >
      {children}
    </Component>
  );
}
