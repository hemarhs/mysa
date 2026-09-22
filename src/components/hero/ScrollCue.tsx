"use client";

import { motion, useReducedMotion } from "framer-motion";

export function ScrollCue() {
  const reduced = useReducedMotion();

  return (
    <div className="absolute bottom-10 left-1/2 z-10 hidden -translate-x-1/2 md:block">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="flex flex-col items-center gap-3"
      >
        <span className="eyebrow text-cream-muted/70">Scroll</span>
        <span className="relative block h-14 w-px overflow-hidden bg-hairline">
          <motion.span
            className="absolute inset-x-0 top-0 block h-5 bg-gold"
            animate={reduced ? {} : { y: ["-100%", "380%"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.4 }}
          />
        </span>
      </motion.div>
    </div>
  );
}
