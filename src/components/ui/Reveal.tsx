"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Stagger position within a group, in seconds. */
  delay?: number;
  /** Distance travelled on entry, in pixels. */
  distance?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "header";
};

/**
 * The site's one motion primitive. Content rises a short distance and fades in
 * as it enters the viewport, once. Respects prefers-reduced-motion by
 * rendering the final state immediately.
 */
export function Reveal({
  children,
  delay = 0,
  distance = 28,
  className,
  as = "div",
}: RevealProps) {
  const reduced = useReducedMotion();
  const Component = motion[as];

  const variants: Variants = {
    hidden: { opacity: 0, y: reduced ? 0 : distance },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduced ? 0 : 0.85,
        delay: reduced ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <Component
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
