"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";

import { Figure } from "@/components/ui/Figure";
import { formatPrice } from "@/lib/format";
import { TEXTURE } from "@/lib/images";
import { cn } from "@/lib/cn";
import { EASE_EXPO } from "@/lib/motion";
import type { MenuItem } from "@/lib/db/schema";

type Props = {
  item: MenuItem;
  currency: string;
  tone: "dark" | "light";
  index: number;
};

/**
 * One line of the board, set like a printed menu: name, dotted leader, price.
 *
 * On wide screens, hovering a row floats its photograph out into the right
 * margin, following the cursor's vertical position. The preview is mounted
 * only while hovered, so a forty-item menu does not hold forty images in the
 * DOM waiting for a mouse that may never arrive.
 */
export function MenuRow({ item, currency, tone, index }: Props) {
  const [hovered, setHovered] = useState(false);
  const rowRef = useRef<HTMLLIElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dark = tone === "dark";

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLLIElement>) => {
    const preview = previewRef.current;
    const row = rowRef.current;
    if (!preview || !row || event.pointerType !== "mouse") return;

    const rect = row.getBoundingClientRect();
    const offset = event.clientY - rect.top - rect.height / 2;
    // Damped, and clamped, so the plate drifts with the cursor rather than
    // chasing it off the end of the row.
    const clamped = Math.max(-28, Math.min(28, offset * 0.35));
    preview.style.transform = `translate3d(0, calc(-50% + ${clamped.toFixed(1)}px), 0)`;
  }, []);

  return (
    <li
      ref={rowRef}
      className={cn(
        "group relative border-b py-8 first:border-t",
        dark ? "border-hairline" : "border-hairline-ink"
      )}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onPointerMove={onPointerMove}
    >
      {/* A gold wash that wipes in behind the row on hover. Inset so it reads
          as a highlighted line in a ledger, not a button. */}
      <span
        className={cn(
          "pointer-events-none absolute inset-y-0 -inset-x-5 -z-10 origin-left scale-x-0 transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100",
          dark ? "bg-gold/[0.045]" : "bg-gold-ink/[0.045]"
        )}
        aria-hidden
      />

      <div className="flex items-baseline gap-5">
        <span
          className={cn(
            "hidden w-8 shrink-0 self-start pt-2 font-sans text-[0.625rem] font-semibold tracking-[0.2em] tnum sm:block",
            dark ? "text-gold/40" : "text-gold-ink/40"
          )}
          aria-hidden
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h3
              className={cn(
                "font-display text-[1.5rem] font-light leading-tight transition-colors duration-500 md:text-[1.75rem]",
                item.isSoldOut
                  ? dark
                    ? "text-cream/40"
                    : "text-espresso/40"
                  : dark
                    ? "text-cream group-hover:text-gold-light"
                    : "text-espresso group-hover:text-gold-ink"
              )}
            >
              {item.name}
            </h3>

            {item.isFeatured && !item.isSoldOut ? (
              <span
                className={cn(
                  "border px-2.5 py-1 font-sans text-[0.5625rem] font-semibold uppercase tracking-[0.2em]",
                  dark
                    ? "border-gold/40 text-gold"
                    : "border-gold-ink/40 text-gold-ink"
                )}
              >
                House pick
              </span>
            ) : null}

            {item.isSoldOut ? (
              <span
                className={cn(
                  "border px-2.5 py-1 font-sans text-[0.5625rem] font-semibold uppercase tracking-[0.2em]",
                  dark
                    ? "border-alert-light/45 text-alert-light"
                    : "border-alert/45 text-alert"
                )}
              >
                Sold out
              </span>
            ) : null}
          </div>

          {item.description ? (
            <p
              className={cn(
                "mt-3.5 max-w-xl text-[0.9375rem] leading-[1.85] transition-opacity duration-500",
                dark ? "text-latte" : "text-mocha",
                item.isSoldOut && "opacity-55"
              )}
            >
              {item.description}
            </p>
          ) : null}

          {item.tags.length ? (
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
              {item.tags.map((tag) => (
                <li
                  key={tag}
                  className={cn(
                    "font-sans text-[0.625rem] font-semibold uppercase tracking-[0.2em]",
                    dark ? "text-latte/60" : "text-mocha/70"
                  )}
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* Dotted leader between the name and the price, as on a printed menu. */}
        <span
          className={cn(
            "mx-1 mb-2.5 hidden h-px min-w-8 flex-1 self-end sm:block",
            dark
              ? "bg-[repeating-linear-gradient(to_right,rgb(201_161_91/0.32)_0_2px,transparent_2px_7px)]"
              : "bg-[repeating-linear-gradient(to_right,rgb(107_69_49/0.28)_0_2px,transparent_2px_7px)]"
          )}
          aria-hidden
        />

        <span
          className={cn(
            "shrink-0 font-sans text-[0.9375rem] tnum transition-colors duration-500",
            item.isSoldOut
              ? dark
                ? "text-cream/35 line-through"
                : "text-espresso/35 line-through"
              : dark
                ? "text-gold"
                : "text-gold-ink"
          )}
        >
          {formatPrice(item.priceCents, currency)}
        </span>
      </div>

      {/* Desktop-only preview, floated into the right margin. */}
      <AnimatePresence>
        {hovered && item.imageUrl ? (
          <motion.div
            ref={previewRef}
            initial={{ opacity: 0, scale: 0.94, x: 18 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.96, x: 12 }}
            transition={{ duration: 0.5, ease: EASE_EXPO }}
            className="pointer-events-none absolute right-0 top-1/2 z-20 hidden w-56 -translate-y-1/2 translate-x-[calc(100%+3rem)] xl:block"
            aria-hidden
          >
            <Figure
              src={item.imageUrl}
              alt=""
              fallback={TEXTURE.warm}
              sizes="224px"
              reveal={false}
              className="aspect-4/5 shadow-warm-lg"
              grade={0.12}
              framed
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}
