"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { Eyebrow } from "@/components/ui/Ornament";
import { BLUR, PHOTOS, type PhotoKey } from "@/lib/images";
import { cn } from "@/lib/cn";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Scroll storytelling: bean → roast → grind → pour.
 *
 * The section pins for a couple of viewport-heights of scroll. The
 * photograph cross-fades and slowly pushes in while the caption block changes
 * beside it, so the scroll wheel is driving a sequence rather than moving a
 * page.
 *
 * Three engineering decisions worth stating:
 *
 *  1. **GSAP is imported dynamically inside the effect.** It never reaches
 *     the server and never lands in the initial bundle; a visitor who leaves
 *     before this section comes into view never downloads ScrollTrigger.
 *  2. **The DOM is complete and readable before any of it runs.** All four
 *     captions and all four photographs are in the markup. If GSAP fails to
 *     load, or the visitor has asked for reduced motion, the section becomes
 *     an ordinary stacked list of four steps — no blank pinned void.
 *  3. **Every trigger this component creates is killed on unmount.** A
 *     ScrollTrigger that outlives its element keeps a pinned spacer in the
 *     document, which is the classic "the page got taller after I navigated
 *     away" bug.
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
    if (prefersReducedMotion()) return;
    // Pinning a section for four screens of scroll is a poor trade on a
    // phone — it costs a lot of thumb travel for one photograph. Narrow
    // viewports get the stacked version.
    if (window.matchMedia("(max-width: 900px)").matches) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled || !sectionRef.current) return;

      gsap.registerPlugin(ScrollTrigger);

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        // Roughly two-thirds of a screen of scroll per step. Four full
        // screens was the first attempt and it felt like being held
        // hostage — a pinned section has to earn every pixel of scroll it
        // takes away from the reader.
        end: () => `+=${window.innerHeight * 2.4}`,
        pin: true,
        pinSpacing: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // Map 0–1 across the pinned run onto a step index. The clamp is
          // load-bearing: at exactly progress === 1 the raw index would be
          // STEPS.length, which is off the end of the array.
          const raw = Math.floor(self.progress * STEPS.length);
          const next = Math.min(STEPS.length - 1, Math.max(0, raw));
          setActive((current) => (current === next ? current : next));
        },
      });

      cleanup = () => {
        trigger.kill(true);
      };
    })().catch((error) => {
      console.warn("[mysa] process section falling back to static:", error);
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="process-heading"
      /* The layout is decided by a CSS breakpoint, not by React state.
       *
       * The first version switched between a stacked layout and a pinned,
       * full-height one once GSAP had loaded. That changed the section's
       * height about a second into the page's life and scored 0.3 CLS —
       * a third of the Core Web Vitals budget spent on a layout decision
       * that was knowable from the viewport width alone.
       *
       * Now the wide layout is full-height from the server render onward and
       * GSAP only adds the pinning and the step changes. If GSAP never loads,
       * the section is a perfectly good static one showing the first step. */
      className="lustre relative isolate overflow-hidden bg-espresso py-24 md:py-32 motion-safe:lg:flex motion-safe:lg:h-[100svh] motion-safe:lg:items-center motion-safe:lg:py-0"
    >
      <div
        className="pointer-events-none absolute right-[-8%] top-1/2 h-[36rem] w-[36rem] -translate-y-1/2 rounded-full opacity-50 blur-[140px]"
        style={{
          background:
            "radial-gradient(circle, rgba(201,161,91,0.16) 0%, rgba(107,69,49,0.08) 46%, transparent 72%)",
        }}
        aria-hidden
      />

      <div className="container-wide relative w-full">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* --- Captions --------------------------------------------------- */}
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
            {/* Every one of these `lg:` rules is gated on `motion-safe`.
                The cross-fade stack shows one step at a time and relies on
                ScrollTrigger to advance `active`. Under reduced motion
                ScrollTrigger never starts, so without the gate steps 02–04
                sat at `opacity: 0` forever — three quarters of the section's
                content, permanently unreadable, for exactly the visitors
                least able to tolerate that. With the gate they fall back to
                the stacked layout at every width. */}
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

            {/* Progress rail. Only meaningful in the pinned, wide layout. */}
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

          {/* --- Plates ------------------------------------------------------ */}
          <div className="lg:col-span-7">
            {/* Wide: a single frame the four photographs cross-fade through.
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
    </section>
  );
}
