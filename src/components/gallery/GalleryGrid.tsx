"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Figure } from "@/components/ui/Figure";
import { cn } from "@/lib/cn";
import { TEXTURE } from "@/lib/images";
import type { GalleryImage } from "@/lib/db/schema";

const FILTERS = [
  { value: "all", label: "Everything" },
  { value: "space", label: "The room" },
  { value: "drinks", label: "Drinks" },
  { value: "desserts", label: "Desserts" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];

export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
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

  // Keyboard control and a simple focus trap while the lightbox is open.
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
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus();
    };
  }, [openIndex, close, next, prev]);

  const active = openIndex === null ? null : visible[openIndex];

  return (
    <>
      <div className="sticky top-[4.5rem] z-30 border-y border-hairline bg-espresso/92 backdrop-blur-xl">
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
                    "relative shrink-0 px-4 py-5 font-sans text-[0.75rem] font-medium uppercase tracking-[0.16em] transition-colors duration-400",
                    isActive ? "text-gold" : "text-cream-muted hover:text-cream"
                  )}
                >
                  {option.label}
                  <span
                    className={cn(
                      "absolute inset-x-4 bottom-0 block h-px bg-gold transition-opacity duration-400",
                      isActive ? "opacity-100" : "opacity-0"
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container-wide py-16 md:py-24">
        {visible.length ? (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
            <AnimatePresence mode="popLayout">
              {visible.map((image, index) => (
                <motion.figure
                  key={image.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.6, delay: Math.min(index, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
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
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      zoomOnHover
                      className={cn(
                        index % 5 === 0 ? "aspect-3/4" : index % 5 === 3 ? "aspect-square" : "aspect-4/5"
                      )}
                    />
                    {image.caption ? (
                      <figcaption className="mt-3 font-sans text-[0.8125rem] text-cream-muted transition-colors duration-500 group-hover:text-cream">
                        {image.caption}
                      </figcaption>
                    ) : null}
                  </button>
                </motion.figure>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <p className="py-16 text-[0.9375rem] text-cream-muted">
            Nothing here yet in this category.
          </p>
        )}
      </div>

      <AnimatePresence>
        {active ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-espresso/97 backdrop-blur-sm p-4 md:p-10"
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
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
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
              className="absolute left-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center text-cream/70 transition-colors hover:text-gold md:flex md:left-6"
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden>
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
              className="absolute right-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center text-cream/70 transition-colors hover:text-gold md:flex md:right-6"
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden>
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <motion.figure
              key={active.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex max-h-full w-full max-w-5xl flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <Figure
                src={active.url}
                alt={active.alt}
                fallback={TEXTURE.dark}
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="aspect-4/3 w-full"
                imageClassName="object-contain"
              />
              <figcaption className="mt-5 flex items-center justify-between gap-6 text-[0.8125rem] text-cream-muted">
                <span>{active.caption ?? active.alt}</span>
                <span className="shrink-0 tabular-nums text-cream-muted/60">
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
