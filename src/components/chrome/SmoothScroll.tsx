"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { prefersReducedMotion } from "@/lib/motion";

/**
 * Lenis smooth scrolling, wired to GSAP's ticker and to ScrollTrigger.
 *
 * Why the wiring matters: Lenis moves the page with a transform-free
 * `scrollTo`, but it runs on its own rAF loop by default. Two independent
 * loops — Lenis's and GSAP's — produce the classic "pinned section lags one
 * frame behind the scroll" jitter. Driving Lenis *from* GSAP's ticker puts
 * scroll position and every ScrollTrigger on the same frame, which is what
 * makes pinned storytelling feel welded to the page rather than chased.
 *
 * Everything here is guarded:
 *   • the import of gsap/ScrollTrigger is dynamic, so it never runs on the
 *     server and never lands in the initial bundle;
 *   • reduced-motion visitors get native scrolling, untouched;
 *   • on unmount every ticker callback, listener and ScrollTrigger created
 *     here is removed, so a route change cannot leave two Lenis instances
 *     fighting over the same document.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedMotion()) return;
    // Coarse pointers already have momentum scrolling from the OS, and
    // hijacking it on a phone is how a site starts feeling "sticky".
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

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

      const onLenisScroll = () => ScrollTrigger.update();
      lenis.on("scroll", onLenisScroll);

      // GSAP's ticker is in seconds; Lenis wants milliseconds.
      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      // Lenis scrolls the real document, so ScrollTrigger needs no proxy —
      // it only needs to be updated on the same frame, which the listener
      // above does. (A scrollerProxy here is the usual cause of pinned
      // sections measuring against the wrong scroller.)
      ScrollTrigger.refresh();

      // Anchor links (the menu rail) must go through Lenis, or the page
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
        lenis.off("scroll", onLenisScroll);
        gsap.ticker.remove(raf);
        gsap.ticker.lagSmoothing(500, 33);
        lenis.destroy();
        document.documentElement.classList.remove("lenis", "lenis-smooth", "lenis-stopped");
      };
    })().catch((error) => {
      // Smooth scrolling is an enhancement. If the chunk fails to load the
      // page must still scroll, so this is logged and swallowed.
      console.warn("[mysa] smooth scroll unavailable:", error);
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  // A route change replaces the document height; ScrollTrigger has to be told,
  // or every pinned section on the new page measures against the old one.
  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      import("gsap/ScrollTrigger")
        .then(({ ScrollTrigger }) => {
          if (!cancelled) ScrollTrigger.refresh();
        })
        .catch(() => {});
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [pathname]);

  return <>{children}</>;
}
