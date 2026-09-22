"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { Figure } from "@/components/ui/Figure";
import { formatPrice } from "@/lib/format";
import { TEXTURE } from "@/lib/images";
import { cn } from "@/lib/cn";
import type { MenuItem } from "@/lib/db/schema";

type Props = {
  item: MenuItem;
  currency: string;
  tone: "dark" | "linen";
};

export function MenuRow({ item, currency, tone }: Props) {
  const [hovered, setHovered] = useState(false);
  const dark = tone === "dark";

  return (
    <li
      className={cn(
        "group relative border-b py-8 first:border-t",
        dark ? "border-hairline" : "border-hairline-ink"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-baseline gap-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h3
              className={cn(
                "font-serif text-[1.375rem] font-light leading-tight transition-colors duration-500 md:text-[1.5rem]",
                item.isSoldOut
                  ? dark
                    ? "text-cream/40"
                    : "text-ink/40"
                  : dark
                    ? "text-cream group-hover:text-gold-light"
                    : "text-ink group-hover:text-gold-dim"
              )}
            >
              {item.name}
            </h3>

            {item.isFeatured && !item.isSoldOut ? (
              <span className="eyebrow border border-gold/40 px-2.5 py-1 text-[0.5625rem] text-gold">
                House pick
              </span>
            ) : null}

            {item.isSoldOut ? (
              <span className="eyebrow border border-terracotta/45 px-2.5 py-1 text-[0.5625rem] text-terracotta">
                Sold out
              </span>
            ) : null}
          </div>

          {item.description ? (
            <p
              className={cn(
                "mt-3 max-w-xl text-[0.9375rem] leading-[1.8] transition-opacity duration-500",
                dark ? "text-cream-muted" : "text-ink-muted",
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
                    "font-sans text-[0.6875rem] uppercase tracking-[0.16em]",
                    dark ? "text-cream-muted/60" : "text-ink-muted/70"
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
            "mx-1 hidden h-px min-w-8 flex-1 self-end mb-2.5 sm:block",
            dark
              ? "bg-[repeating-linear-gradient(to_right,rgb(200_161_101/0.3)_0_2px,transparent_2px_7px)]"
              : "bg-[repeating-linear-gradient(to_right,rgb(26_21_18/0.2)_0_2px,transparent_2px_7px)]"
          )}
          aria-hidden
        />

        <span
          className={cn(
            "shrink-0 font-sans text-[1rem] tabular-nums transition-colors duration-500",
            item.isSoldOut
              ? dark
                ? "text-cream/35 line-through"
                : "text-ink/35 line-through"
              : dark
                ? "text-gold"
                : "text-gold-dim"
          )}
        >
          {formatPrice(item.priceCents, currency)}
        </span>
      </div>

      {/* Desktop-only preview, floated beside the row. */}
      <AnimatePresence>
        {hovered && item.imageUrl ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, x: 16 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.96, x: 10 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute right-0 top-1/2 z-20 hidden w-52 -translate-y-1/2 translate-x-[calc(100%+2.5rem)] xl:block"
            aria-hidden
          >
            <Figure
              src={item.imageUrl}
              alt=""
              fallback={TEXTURE.warm}
              sizes="208px"
              className="aspect-4/5 shadow-2xl shadow-black/50"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}
