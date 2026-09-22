"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * The scroll cue: a hairline track with a gold bead falling through it, set
 * under a small label. Hidden on narrow screens, where the gesture is
 * obvious and the space is not there to spare.
 */
export function ScrollCue() {
  const reduced = useReducedMotion();

  return (
    <div className="absolute bottom-10 left-1/2 z-10 hidden -translate-x-1/2 md:block">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1.1 }}
        className="flex flex-col items-center gap-4"
      >
        <span className="font-sans text-[0.5625rem] font-semibold uppercase tracking-[0.34em] text-latte/60">
          Scroll
        </span>
        <span className="relative block h-16 w-px overflow-hidden bg-hairline">
          <motion.span
            className="absolute inset-x-0 top-0 block h-6 bg-gradient-to-b from-transparent via-gold to-transparent"
            animate={reduced ? {} : { y: ["-120%", "420%"] }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              ease: [0.25, 0.46, 0.45, 0.94],
              repeatDelay: 0.5,
            }}
          />
        </span>
      </motion.div>
    </div>
  );
}
