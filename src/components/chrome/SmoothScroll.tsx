"use client";

import { useEffect } from "react";

import { prefersReducedMotion } from "@/lib/motion";

/**
 * Lenis smooth scrolling.
 *
 * Lenis runs its own requestAnimationFrame loop here. An earlier version drove
 * it from GSAP's ticker so that ScrollTrigger and Lenis shared a frame — but
 * nothing on this site uses ScrollTrigger any more (the one pinned section is
 * plain `position: sticky`), so GSAP was a 70KB dependency being carried for a
 * single line of plumbing. It is gone.
 *
 * Everything here is guarded:
 *   • the Lenis import is dynamic, so it never runs on the server and never
 *     lands in the initial bundle;
 *   • reduced-motion visitors and touch devices get native scrolling,
 *     untouched — a phone already has momentum scrolling from the OS, and
 *     hijacking it is how a site starts feeling sticky;
 *   • on unmount every listener and the instance itself are disposed, so a
 *     route change cannot leave two Lenis instances fighting over one
 *     document;
 *   • if the chunk fails to load, the page still scrolls natively. Smooth
 *     scrolling is an enhancement, never a requirement.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const { default: Lenis } = await import("lenis");
      if (cancelled) return;

      const lenis = new Lenis({
        duration: 1.15,
        // Long, flat deceleration. The default is springier than this brand.
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.6,
        infinite: false,
      });

      document.documentElement.classList.add("lenis");

      let frame = 0;
      const raf = (time: number) => {
        lenis.raf(time);
        frame = window.requestAnimationFrame(raf);
      };
      frame = window.requestAnimationFrame(raf);

      // Anchor links (the menu rail) have to go through Lenis, or the browser
      // jumps and Lenis then fights it back.
      const onAnchorClick = (event: MouseEvent) => {
        if (event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        const anchor = (event.target as Element | null)?.closest?.('a[href^="#"]');
        if (!(anchor instanceof HTMLAnchorElement)) return;

        const id = anchor.getAttribute("href")?.slice(1);
        if (!id) return;

        const target = document.getElementById(id);
        if (!target) return;

        event.preventDefault();
        lenis.scrollTo(target, { offset: -96, duration: 1.4 });
        history.replaceState(null, "", `#${id}`);
      };
      document.addEventListener("click", onAnchorClick);

      cleanup = () => {
        document.removeEventListener("click", onAnchorClick);
        window.cancelAnimationFrame(frame);
        lenis.destroy();
        document.documentElement.classList.remove(
          "lenis",
          "lenis-smooth",
          "lenis-stopped"
        );
      };
    })().catch((error) => {
      console.warn("[mysa] smooth scroll unavailable:", error);
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return <>{children}</>;
}
