"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Slow steam behind the footer.
 *
 * Six blurred gold plumes on staggered CSS animations — no canvas, no WebGL,
 * no third canvas context competing with the hero for the browser's limited
 * pool. The whole thing is roughly a kilobyte of transform work that the
 * compositor handles.
 *
 * It mounts only when the footer is actually on screen and removes itself on
 * reduced-motion, so it costs nothing for most of a visit.
 */

const PLUMES = [
  { left: "12%", delay: 0, duration: 15, width: 130, tint: 0.07 },
  { left: "27%", delay: 4.5, duration: 19, width: 90, tint: 0.05 },
  { left: "44%", delay: 2.2, duration: 17, width: 150, tint: 0.06 },
  { left: "61%", delay: 7.5, duration: 21, width: 110, tint: 0.045 },
  { left: "78%", delay: 1.2, duration: 16, width: 135, tint: 0.055 },
  { left: "90%", delay: 9.5, duration: 23, width: 95, tint: 0.04 },
] as const;

export function FooterSteam() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: "200px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      {active
        ? PLUMES.map((plume) => (
            <span
              key={plume.left}
              className="absolute bottom-0 block rounded-full blur-2xl will-change-transform"
              style={{
                left: plume.left,
                width: `${plume.width}px`,
                height: `${plume.width * 2.4}px`,
                background: `radial-gradient(ellipse at 50% 100%, rgba(201,161,91,${plume.tint}) 0%, rgba(217,194,163,${
                  plume.tint * 0.5
                }) 40%, transparent 72%)`,
                animation: `steam-drift ${plume.duration}s cubic-bezier(0.25,0.46,0.45,0.94) ${plume.delay}s infinite`,
              }}
            />
          ))
        : null}
    </div>
  );
}
