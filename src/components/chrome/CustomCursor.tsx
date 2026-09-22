"use client";

import { useEffect, useRef } from "react";

/**
 * A small gold dot with a ring that trails behind it and opens up over
 * anything interactive.
 *
 * Deliberately built without React state. A cursor updates on every pointer
 * move — running that through the reconciler would re-render a component
 * sixty times a second for two `transform` values. The dot is positioned
 * directly on the DOM node inside one requestAnimationFrame loop, so the
 * cost is a couple of style writes per frame and nothing else.
 *
 * It only ever activates on a device with a fine, hover-capable pointer, and
 * it hides the native cursor via a `data-cursor` attribute on <html> rather
 * than a blanket stylesheet rule, so if this component fails to mount the
 * real cursor is untouched.
 */

const INTERACTIVE = 'a, button, [role="button"], [role="tab"], summary, label[for], input[type="submit"]';

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const fine = window.matchMedia("(pointer: fine)");
    const canHover = window.matchMedia("(hover: hover)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!fine.matches || !canHover.matches || reduced.matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const root = document.documentElement;
    root.setAttribute("data-cursor", "on");

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let ringX = pointerX;
    let ringY = pointerY;
    let visible = false;
    let frame = 0;

    const onMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;

      if (!visible) {
        visible = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
    };

    const onLeave = () => {
      visible = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };

    const onDown = () => ring.setAttribute("data-pressed", "true");
    const onUp = () => ring.removeAttribute("data-pressed");

    // Delegated hover detection: one listener rather than one per element,
    // which also means elements added later (a modal, a lightbox) work with
    // no extra wiring.
    const onOver = (event: Event) => {
      const target = event.target as Element | null;
      const hit = target?.closest?.(INTERACTIVE);
      if (hit) ring.setAttribute("data-active", "true");
      else ring.removeAttribute("data-active");
    };

    const tick = () => {
      // The dot is exact; the ring eases toward it, which is what produces
      // the trail without any physics.
      ringX += (pointerX - ringX) * 0.16;
      ringY += (pointerY - ringY) * 0.16;

      dot.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    window.addEventListener("blur", onLeave);

    // If the pointer type changes — a tablet with a keyboard folio attached,
    // or a user switching to touch — stand down and give the native cursor
    // back rather than leaving an orphaned dot on screen.
    const onCapabilityChange = () => {
      if (!fine.matches || !canHover.matches) {
        root.removeAttribute("data-cursor");
        onLeave();
      } else {
        root.setAttribute("data-cursor", "on");
      }
    };
    fine.addEventListener("change", onCapabilityChange);
    canHover.addEventListener("change", onCapabilityChange);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
      fine.removeEventListener("change", onCapabilityChange);
      canHover.removeEventListener("change", onCapabilityChange);
      root.removeAttribute("data-cursor");
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[150] hidden md:block">
      <div
        ref={ringRef}
        data-cursor-ring
        className="fixed left-0 top-0 h-9 w-9 rounded-full border border-gold/55 opacity-0 transition-[width,height,opacity,background-color,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] data-[active=true]:h-16 data-[active=true]:w-16 data-[active=true]:border-gold data-[active=true]:bg-gold/8 data-[pressed=true]:h-7 data-[pressed=true]:w-7"
      />
      <div
        ref={dotRef}
        className="fixed left-0 top-0 h-1.5 w-1.5 rounded-full bg-gold opacity-0 transition-opacity duration-300"
      />
    </div>
  );
}
