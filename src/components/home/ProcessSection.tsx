"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { Eyebrow } from "@/components/ui/Ornament";
import { BLUR, PHOTOS, type PhotoKey } from "@/lib/images";
import { cn } from "@/lib/cn";

/**
 * Scroll storytelling: bean → roast → grind → pour.
 *
 * On a wide screen the section is three viewport-heights tall and its inner
 * panel is `position: sticky`, so the panel holds still while the page scrolls
 * past it and the photograph and caption change underneath. On a narrow screen
 * it is an ordinary stacked list of four steps.
 *
 * ── Why this is CSS sticky and not GSAP's ScrollTrigger pin ──────────────
 *
 * It used to be a pin, and the pin was the cause of this crash:
 *
 *     Runtime NotFoundError
 *     Failed to execute 'removeChild' on 'Node':
 *     The node to be removed is not a child of this node.
 *
 * ScrollTrigger implements `pin: true` by inserting a `pin-spacer` wrapper
 * into the document and *moving the pinned element inside it*. That element is
 * a node React created and still believes it owns. The moment React unmounts
 * this subtree — which happens on every client-side navigation away from the
 * home page — it calls `removeChild(section)` on the parent it remembers, the
 * section is no longer there, and the app throws.
 *
 * No amount of cleanup ordering makes that reliably safe: React and a library
 * that relocates DOM nodes are two owners of one tree. `position: sticky` gets
 * the identical effect with no DOM mutation at all, so React owns every node
 * for the component's whole life and the failure mode cannot occur.
 *
 * The step index is computed from scroll position in a rAF-throttled listener
 * — four lines of arithmetic, and no library.
 */

type Step = {
  key: PhotoKey;
  index: string;
  title: string;
  body: string;
  meta: string;
};

const STEPS: Step[] = [
  {
    key: "beans",
    index: "01",
    title: "Bought, not sourced",
    body: "Lots small enough that we can name the farm and the person who picked it. Prices agreed before harvest, paid above the Fairtrade floor.",
    meta: "Guji · Huila · Cerrado · Nyeri",
  },
  {
    key: "roasting",
    index: "02",
    title: "Roasted on Tuesdays",
    body: "Five kilos at a time on a drum in the back of the shop. Nothing is sold more than sixteen days off roast, which is why the board changes.",
    meta: "5kg drum · in house",
  },
  {
    key: "espressoMachine",
    index: "03",
    title: "Ground to order",
    body: "Dialled in every morning and again whenever the weather turns. A dose that was right at seven is not necessarily right at four.",
    meta: "Dialled twice daily",
  },
  {
    key: "pourOver",
    index: "04",
    title: "Poured slowly",
    body: "A cortado takes as long as it takes. We would rather you wait ninety seconds for something made properly than be handed something forgettable.",
    meta: "Ninety seconds, about",
  },
];

export function ProcessSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // The sticky sequence only exists at lg and above, and only when motion
    // is allowed; below that the section is a plain stack with no step to
    // track.
    const wide = window.matchMedia("(min-width: 1024px)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const read = () => {
      frame = 0;
      if (!wide.matches || still.matches) return;

      const rect = section.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      if (travel <= 0) return;

      // 0 when the section's top reaches the top of the viewport, 1 when its
      // bottom does.
      const progress = Math.min(1, Math.max(0, -rect.top / travel));

      // The clamp is load-bearing: at exactly progress === 1 the raw index
      // would be STEPS.length, which is off the end of the array.
      const next = Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length));
      setActive((current) => (current === next ? current : next));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="process-heading"
      /* Three screens of scroll on wide viewports, so the sticky panel has
         somewhere to travel. `motion-safe` gates it: under reduced motion the
         sticky sequence would strand steps 02–04 at opacity 0, because the
         scroll listener above is the only thing that advances them. */
      className="lustre relative isolate bg-espresso motion-safe:lg:h-[320vh]"
    >
      <div className="relative py-24 md:py-32 motion-safe:lg:sticky motion-safe:lg:top-0 motion-safe:lg:flex motion-safe:lg:h-screen motion-safe:lg:items-center motion-safe:lg:overflow-hidden motion-safe:lg:py-0">
        {/* The glow hangs 8% past the right edge on purpose — a light source
            should not have a visible boundary. It needs its own clipping
            wrapper rather than `overflow-hidden` on the panel above, because
            that panel is the sticky element: making it a scroll container
            would break the pin. Without this wrapper the glow widened the
            document by ~20px on a 390px phone. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="absolute right-[-8%] top-1/2 h-[36rem] w-[36rem] -translate-y-1/2 rounded-full opacity-50 blur-[140px]"
            style={{
              background:
                "radial-gradient(circle, rgba(201,161,91,0.16) 0%, rgba(107,69,49,0.08) 46%, transparent 72%)",
            }}
          />
        </div>

        <div className="container-wide relative w-full">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* --- Captions ------------------------------------------------- */}
            <div className="lg:col-span-5">
              <Eyebrow>How it gets to you</Eyebrow>

              <h2
                id="process-heading"
                className="display mt-7 text-[clamp(1.875rem,3.6vw,3rem)] text-cream"
              >
                Four hands, four rooms,
                <br />
                one cup.
              </h2>

              {/* Wide: one caption at a time, cross-faded in place.
                  Narrow: all four, stacked and numbered. */}
              <div className="mt-12 space-y-12 motion-safe:lg:relative motion-safe:lg:h-64 motion-safe:lg:space-y-0">
                {STEPS.map((step, index) => (
                  <article
                    key={step.key}
                    aria-current={active === index ? "step" : undefined}
                    className={cn(
                      "border-l border-hairline pl-7",
                      "motion-safe:lg:absolute motion-safe:lg:inset-x-0 motion-safe:lg:top-0",
                      "motion-safe:lg:border-l-0 motion-safe:lg:pl-0",
                      "motion-safe:lg:transition-all motion-safe:lg:duration-700",
                      "motion-safe:lg:ease-[cubic-bezier(0.16,1,0.3,1)]",
                      active === index
                        ? "motion-safe:lg:translate-y-0 motion-safe:lg:opacity-100"
                        : "motion-safe:lg:pointer-events-none motion-safe:lg:translate-y-4 motion-safe:lg:opacity-0"
                    )}
                  >
                    <span className="font-sans text-[0.6875rem] font-semibold tracking-[0.24em] tnum text-gold">
                      {step.index}
                    </span>
                    <h3 className="mt-4 font-display text-[clamp(1.5rem,2.6vw,2.125rem)] font-light text-cream">
                      {step.title}
                    </h3>
                    <p className="mt-5 max-w-md text-[0.9375rem] leading-[1.9] text-latte">
                      {step.body}
                    </p>
                    <p className="mt-5 font-sans text-[0.625rem] font-semibold uppercase tracking-[0.24em] text-gold/60">
                      {step.meta}
                    </p>
                  </article>
                ))}
              </div>

              {/* Progress rail. Only meaningful in the sticky, wide layout. */}
              <div className="mt-10 hidden items-center gap-2.5 motion-safe:lg:flex" aria-hidden>
                {STEPS.map((step, index) => (
                  <span
                    key={step.key}
                    className={cn(
                      "block h-px transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                      active === index ? "w-14 bg-gold" : "w-7 bg-hairline"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* --- Plates ---------------------------------------------------- */}
            <div className="lg:col-span-7">
              {/* Wide: one frame the four photographs cross-fade through.
                  Narrow: a plain grid of all four. */}
              <div className="relative hidden aspect-16/11 overflow-hidden bg-roast motion-safe:lg:block">
                {STEPS.map((step, index) => {
                  const photo = PHOTOS[step.key];
                  return (
                    <div
                      key={step.key}
                      className={cn(
                        "absolute inset-0 transition-[opacity,transform] duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform",
                        active === index
                          ? "scale-100 opacity-100"
                          : "scale-[1.07] opacity-0"
                      )}
                    >
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        sizes="55vw"
                        placeholder="blur"
                        blurDataURL={BLUR}
                        className="object-cover"
                      />
                    </div>
                  );
                })}

                <div
                  className="pointer-events-none absolute inset-0 mix-blend-soft-light"
                  style={{ backgroundColor: "rgba(201,161,91,0.12)" }}
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute inset-4 border border-gold/20"
                  aria-hidden
                />
              </div>

              <div className="grid grid-cols-2 gap-4 motion-safe:lg:hidden">
                {STEPS.map((step) => {
                  const photo = PHOTOS[step.key];
                  return (
                    <div
                      key={step.key}
                      className="relative aspect-4/5 overflow-hidden bg-roast"
                    >
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        sizes="(max-width: 768px) 50vw, 28vw"
                        placeholder="blur"
                        blurDataURL={BLUR}
                        className="object-cover"
                      />
                      <div
                        className="pointer-events-none absolute inset-0 mix-blend-soft-light"
                        style={{ backgroundColor: "rgba(201,161,91,0.12)" }}
                        aria-hidden
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
