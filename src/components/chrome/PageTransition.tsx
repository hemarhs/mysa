"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Route transition: a warm curtain sweeps up over the page, and the incoming
 * content rises into place behind it.
 *
 * Built without AnimatePresence on purpose. Exit animations require keeping
 * the outgoing tree mounted, and in the App Router that tree is made of
 * server components whose data has already been replaced — which is how you
 * get a flash of the previous page's stale content mid-transition. Here the
 * curtain is an independent overlay driven only by `pathname`, so it never
 * has to hold on to anything.
 *
 * The curtain is `pointer-events-none` throughout and its total life is
 * 820ms, after which it is removed from the DOM. There is no state in which
 * it can sit over the page and swallow clicks.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const previous = useRef(pathname);
  const [sweeping, setSweeping] = useState(false);
  const [contentKey, setContentKey] = useState(pathname);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;

    if (prefersReducedMotion()) {
      // Still swap the key, so the incoming page gets a fresh subtree —
      // just without the curtain.
      const plain = window.requestAnimationFrame(() => setContentKey(pathname));
      return () => window.cancelAnimationFrame(plain);
    }

    // Both updates are deferred to the next frame. Setting them synchronously
    // inside the effect would queue a second render pass before the browser
    // has painted the first — the classic cascading-render stall, and exactly
    // what makes a route transition feel like a stutter rather than a wipe.
    const raised = window.requestAnimationFrame(() => {
      setContentKey(pathname);
      setSweeping(true);
    });

    const id = window.setTimeout(() => setSweeping(false), 820);
    timers.current.push(id);

    return () => {
      window.cancelAnimationFrame(raised);
      window.clearTimeout(id);
    };
  }, [pathname]);

  useEffect(() => {
    const captured = timers.current;
    return () => {
      captured.forEach(window.clearTimeout);
      captured.length = 0;
    };
  }, []);

  return (
    <>
      {sweeping ? (
        <div
          className="pointer-events-none fixed inset-0 z-[120] overflow-hidden"
          aria-hidden
        >
          <div className="absolute inset-0 origin-bottom animate-[curtain-wipe_820ms_cubic-bezier(0.76,0,0.24,1)_forwards] bg-espresso" />
          <div className="absolute inset-x-0 top-0 h-px animate-[curtain-seam_820ms_cubic-bezier(0.76,0,0.24,1)_forwards] bg-gold" />
          <style>{`
            @keyframes curtain-wipe {
              0%   { transform: scaleY(0); transform-origin: bottom; }
              45%  { transform: scaleY(1); transform-origin: bottom; }
              55%  { transform: scaleY(1); transform-origin: top; }
              100% { transform: scaleY(0); transform-origin: top; }
            }
            @keyframes curtain-seam {
              0%   { opacity: 0; transform: translateY(100vh); }
              45%  { opacity: 0.8; transform: translateY(0); }
              55%  { opacity: 0.8; transform: translateY(0); }
              100% { opacity: 0; transform: translateY(-2rem); }
            }
          `}</style>
        </div>
      ) : null}

      <div
        key={contentKey}
        data-motion
        className={cn(
          "motion-safe:animate-[fade-up_700ms_cubic-bezier(0.16,1,0.3,1)_120ms_both]"
        )}
      >
        {children}
      </div>
    </>
  );
}
