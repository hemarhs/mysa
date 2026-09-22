"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** A single gold hairline across the top, tracking read position. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-px origin-left bg-gradient-to-r from-gold-dim via-gold to-gold-light"
      aria-hidden
    />
  );
}
