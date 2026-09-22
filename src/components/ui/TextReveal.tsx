"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/cn";

type Props = {
  /** One entry per visual line. Lines are revealed in sequence. */
  lines: string[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "div";
  /** Play on mount (hero) rather than on scroll (everything else). */
  onMount?: boolean;
};

/**
 * Masked line reveal: each line sits in an overflow-hidden box and rises into
 * place. This is the site's signature type animation — it reads as typesetting
 * rather than as a web effect, which a plain fade does not.
 */
export function TextReveal({
  lines,
  className,
  lineClassName,
  delay = 0,
  as: Tag = "h2",
  onMount = false,
}: Props) {
  const reduced = useReducedMotion();

  const animation = reduced
    ? {}
    : {
        initial: "hidden" as const,
        ...(onMount
          ? { animate: "visible" as const }
          : {
              whileInView: "visible" as const,
              viewport: { once: true, margin: "0px 0px -15% 0px" },
            }),
      };

  return (
    <Tag className={className}>
      {lines.map((line, index) => (
        <span key={line + index} className={cn("block overflow-hidden", lineClassName)}>
          <motion.span
            className="block will-change-transform"
            variants={{
              hidden: { y: "110%", opacity: 0 },
              visible: {
                y: "0%",
                opacity: 1,
                transition: {
                  duration: 1,
                  delay: delay + index * 0.11,
                  ease: [0.16, 1, 0.3, 1],
                },
              },
            }}
            {...animation}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
