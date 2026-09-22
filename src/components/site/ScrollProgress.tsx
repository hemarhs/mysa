"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** A single brass hairline across the very top, tracking read position. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[110] h-px origin-left bg-gradient-to-r from-gold-deep via-gold to-gold-light"
      aria-hidden
    />
  );
}
