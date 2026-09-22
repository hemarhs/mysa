"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Figure } from "@/components/ui/Figure";
import { cn } from "@/lib/cn";
import { TEXTURE } from "@/lib/images";
import { EASE_EXPO } from "@/lib/motion";
import type { GalleryImage } from "@/lib/db/schema";

const FILTERS = [
  { value: "all", label: "Everything" },
  { value: "space", label: "The room" },
  { value: "drinks", label: "Drinks" },
  { value: "desserts", label: "Desserts" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];

/**
 * The gallery: a horizontal, perspective rail on wide screens and a masonry
 * column stack on narrow ones, with a shared lightbox.
 *
 * The rail is a real horizontally-scrolling element — not a transform-driven
 * fake — so the trackpad, shift-wheel, touch, and keyboard all work without
 * any of it being re-implemented. What is added on top is purely visual: each
 * plate's rotation and depth are recomputed from its distance to the centre
 * of the viewport on scroll, which gives the carousel its perspective while
 * leaving native scrolling completely intact.
 *
 * The scroll handler is throttled to one `requestAnimationFrame` and writes
 * transforms directly to the nodes. Running it through React state would
 * re-render every plate on every scroll frame.
 */
export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const visible = useMemo(
    () => (filter === "all" ? images : images.filter((image) => image.category === filter)),
    [filter, images]
  );

  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % visible.length)),
    [visible.length]
  );
  const prev = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i - 1 + visible.length) % visible.length)),
    [visible.length]
  );

  /* ---------------------------------------------------------------------
     Perspective. Each plate is rotated and pushed back in proportion to how
     far its centre sits from the centre of the rail.
     --------------------------------------------------------------------- */
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;

    const apply = () => {
      frame = 0;
      const railRect = rail.getBoundingClientRect();
      const centre = railRect.left + railRect.width / 2;

      for (const child of Array.from(rail.children)) {
        if (!(child instanceof HTMLElement)) continue;
        const rect = child.getBoundingClientRect();
        const offset = rect.left + rect.width / 2 - centre;
        // −1 at the left edge, 0 in the middle, 1 at the right edge.
        const ratio = Math.max(-1.3, Math.min(1.3, offset / (railRect.width / 2)));

        const rotate = (-ratio * 11).toFixed(2);
        const depth = (-Math.abs(ratio) * 130).toFixed(1);
        const lift = (Math.abs(ratio) * 16).toFixed(1);

        child.style.transform = `perspective(1400px) translate3d(0, ${lift}px, ${depth}px) rotateY(${rotate}deg)`;
        child.style.opacity = String(1 - Math.abs(ratio) * 0.32);
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(apply);
    };

    apply();
    rail.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      rail.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [visible]);

  /** Vertical wheel gestures drive the rail horizontally — expected on a
   *  carousel, and the only way a mouse with one wheel can use it. */
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

      const atStart = rail.scrollLeft <= 0;
      const atEnd = rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 1;
      // Let the page take over at the ends, so the rail never traps the
      // scroll and strands the visitor halfway down the site.
      if ((atStart && event.deltaY < 0) || (atEnd && event.deltaY > 0)) return;

      event.preventDefault();
      rail.scrollLeft += event.deltaY;
    };

    rail.addEventListener("wheel", onWheel, { passive: false });
    return () => rail.removeEventListener("wheel", onWheel);
  }, []);

  /* --- Lightbox: keyboard control and a focus trap --------------------- */
  useEffect(() => {
    if (openIndex === null) return;

    previouslyFocused.current = document.activeElement as HTMLElement;
    closeButtonRef.current?.focus();
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") prev();
      if (event.key === "Tab") {
        // Only one focusable control in the dialog, so keep focus on it.
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    const restore = previouslyFocused.current;

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.removeProperty("overflow");
      restore?.focus();
    };
  }, [openIndex, close, next, prev]);

  const active = openIndex === null ? null : visible[openIndex];

  return (
    <>
      {/* --- Filters ------------------------------------------------------ */}
      <div className="sticky top-[4.25rem] z-40 border-y border-hairline bg-void/88 backdrop-blur-xl backdrop-saturate-150">
        <div className="container-wide">
          <div
            className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto"
            role="tablist"
            aria-label="Filter photographs"
          >
            {FILTERS.map((option) => {
              const isActive = filter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setFilter(option.value)}
                  className={cn(
                    "relative shrink-0 px-4 py-5 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.2em] transition-colors duration-500",
                    isActive ? "text-gold" : "text-latte/75 hover:text-cream"
                  )}
                >
                  {option.label}
                  <span
                    className={cn(
                      "absolute inset-x-4 bottom-0 block h-px origin-center bg-gold transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                      isActive ? "scale-x-100" : "scale-x-0"
                    )}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {visible.length ? (
        <>
          {/* --- Wide screens: the perspective rail ---------------------- */}
          <div className="relative hidden py-16 md:block md:py-20">
            <div
              ref={railRef}
              className="no-scrollbar flex snap-x snap-mandatory gap-7 overflow-x-auto px-[max(1.25rem,calc(50vw-24rem))] py-8 [perspective:1400px]"
              role="group"
              aria-label="Photographs, scroll sideways"
            >
              {visible.map((image, index) => (
                <figure
                  key={image.id}
                  className="w-[clamp(18rem,30vw,26rem)] shrink-0 snap-center transition-[transform,opacity] duration-300 ease-out will-change-transform"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(index)}
                    className="group block w-full cursor-zoom-in text-left"
                    aria-label={`Open: ${image.alt}`}
                  >
                    <Figure
                      src={image.url}
                      alt={image.alt}
                      fallback={TEXTURE.dark}
                      sizes="(max-width: 1280px) 40vw, 26rem"
                      zoomOnHover
                      className={cn(
                        "shadow-warm-lg",
                        index % 3 === 0
                          ? "aspect-3/4"
                          : index % 3 === 1
                            ? "aspect-square"
                            : "aspect-4/5"
                      )}
                      grade={0.1}
                    />
                    <figcaption className="mt-4 flex items-baseline justify-between gap-4">
                      <span className="text-[0.875rem] text-latte transition-colors duration-500 group-hover:text-cream">
                        {image.caption ?? image.alt}
                      </span>
                      <span className="shrink-0 font-sans text-[0.625rem] font-semibold tracking-[0.2em] tnum text-gold/60">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </figcaption>
                  </button>
                </figure>
              ))}
            </div>

            {/* Feathered ends, so plates leave the frame rather than stop. */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-espresso to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-espresso to-transparent" />

            <p className="container-wide mt-6 font-sans text-[0.625rem] font-semibold uppercase tracking-[0.24em] text-latte/50">
              Scroll sideways &middot; {visible.length} photographs
            </p>
          </div>

          {/* --- Narrow screens: a column stack -------------------------- */}
          <div className="container-wide py-12 md:hidden">
            <div className="columns-1 gap-4 sm:columns-2 [&>*]:mb-4">
              <AnimatePresence mode="popLayout">
                {visible.map((image, index) => (
                  <motion.figure
                    key={image.id}
                    layout
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{
                      duration: 0.6,
                      delay: Math.min(index, 6) * 0.04,
                      ease: EASE_EXPO,
                    }}
                    className="break-inside-avoid"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIndex(index)}
                      className="group block w-full cursor-zoom-in text-left"
                      aria-label={`Open: ${image.alt}`}
                    >
                      <Figure
                        src={image.url}
                        alt={image.alt}
                        fallback={TEXTURE.dark}
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className={cn(
                          index % 5 === 0
                            ? "aspect-3/4"
                            : index % 5 === 3
                              ? "aspect-square"
                              : "aspect-4/5"
                        )}
                      />
                      {image.caption ? (
                        <figcaption className="mt-3 text-[0.8125rem] text-latte">
                          {image.caption}
                        </figcaption>
                      ) : null}
                    </button>
                  </motion.figure>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </>
      ) : (
        <div className="container-wide py-24">
          <p className="text-[0.9375rem] text-latte">
            Nothing here yet in this category.
          </p>
        </div>
      )}

      {/* --- Lightbox ------------------------------------------------------ */}
      <AnimatePresence>
        {active ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[130] flex items-center justify-center bg-espresso/97 p-4 backdrop-blur-sm md:p-10"
            role="dialog"
            aria-modal="true"
            aria-label={active.alt}
            onClick={close}
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-5 top-5 z-10 flex h-12 w-12 items-center justify-center text-cream transition-colors duration-300 hover:text-gold md:right-8 md:top-8"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.1"
                aria-hidden
              >
                <path d="M5 5l14 14M19 5L5 19" />
              </svg>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="Previous photograph"
              className="absolute left-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center text-cream/70 transition-colors hover:text-gold md:left-6 md:flex"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                aria-hidden
              >
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="Next photograph"
              className="absolute right-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center text-cream/70 transition-colors hover:text-gold md:right-6 md:flex"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                aria-hidden
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <motion.figure
              key={active.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: EASE_EXPO }}
              className="relative flex max-h-full w-full max-w-5xl flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <Figure
                src={active.url}
                alt={active.alt}
                fallback={TEXTURE.dark}
                sizes="(max-width: 1024px) 100vw, 1024px"
                reveal={false}
                className="aspect-4/3 w-full"
                imageClassName="object-contain"
                grade={0.06}
              />
              <figcaption className="mt-5 flex items-center justify-between gap-6 text-[0.8125rem] text-latte">
                <span>{active.caption ?? active.alt}</span>
                <span className="shrink-0 tnum text-latte/60">
                  {(openIndex ?? 0) + 1} / {visible.length}
                </span>
              </figcaption>
            </motion.figure>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
