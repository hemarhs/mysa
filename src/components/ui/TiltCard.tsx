"use client";

import { useCallback, useRef } from "react";

import { Figure } from "@/components/ui/Figure";
import { TEXTURE } from "@/lib/images";
import { cn } from "@/lib/cn";

type Props = {
  imageUrl?: string | null;
  imageAlt: string;
  index: number;
  eyebrow?: string;
  title: string;
  price?: string;
  description?: string | null;
  soldOut?: boolean;
  className?: string;
};

/**
 * A catalogue plate that tips toward the cursor, with a moving specular
 * glare and a gold hairline that lights up.
 *
 * Implementation notes, because this is the kind of component that quietly
 * destroys a page's frame budget if it is built the obvious way:
 *
 *  • No React state. Pointer move writes two CSS custom properties and a
 *    transform straight onto the node. State here would re-render a subtree
 *    containing a next/image on every mouse move.
 *  • The tilt is applied to a wrapper, and the glare reads the same custom
 *    properties, so the two can never drift apart.
 *  • `pointerType` is checked: on a touch screen a tap would otherwise leave
 *    the card stuck at whatever angle the finger last touched.
 *  • Everything is transform and opacity, so it stays on the compositor.
 *  • The whole effect is skipped under `prefers-reduced-motion`, leaving a
 *    perfectly good flat card.
 */
export function TiltCard({
  imageUrl,
  imageAlt,
  index,
  eyebrow,
  title,
  price,
  description,
  soldOut = false,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node || event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = node.getBoundingClientRect();
    // Normalised to −0.5…0.5 from the centre of the card.
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    node.style.setProperty("--tilt-x", `${(-y * 9).toFixed(2)}deg`);
    node.style.setProperty("--tilt-y", `${(x * 11).toFixed(2)}deg`);
    node.style.setProperty("--glare-x", `${((x + 0.5) * 100).toFixed(1)}%`);
    node.style.setProperty("--glare-y", `${((y + 0.5) * 100).toFixed(1)}%`);
    node.style.setProperty("--glare-opacity", "1");
  }, []);

  const onPointerLeave = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty("--tilt-x", "0deg");
    node.style.setProperty("--tilt-y", "0deg");
    node.style.setProperty("--glare-opacity", "0");
  }, []);

  return (
    <article
      className={cn("group h-full [perspective:1400px]", className)}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div
        ref={ref}
        className="flex h-full flex-col transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform motion-reduce:!transform-none"
        style={{
          transform:
            "rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg)) translate3d(0,0,0)",
          transformStyle: "preserve-3d",
        }}
      >
        <div className="gilt relative overflow-hidden">
          <Figure
            src={imageUrl ?? TEXTURE.warm}
            alt={imageAlt}
            fallback={TEXTURE.warm}
            sizes="(max-width: 768px) 100vw, 33vw"
            zoomOnHover
            revealDelay={index * 0.08}
            className="aspect-4/5"
            grade={0.12}
          />

          {/* The glare. A soft radial highlight that follows the pointer and
              fades out the moment it leaves — the look of light moving over
              a glossy print. */}
          <span
            className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-500"
            style={{
              opacity: "var(--glare-opacity, 0)",
              background:
                "radial-gradient(38% 38% at var(--glare-x, 50%) var(--glare-y, 50%), rgba(245,236,221,0.75) 0%, rgba(201,161,91,0.25) 45%, transparent 72%)",
            }}
            aria-hidden
          />

          {/* Gold hairline frame, drawn only on hover. */}
          <span
            className="pointer-events-none absolute inset-0 border border-gold/0 transition-colors duration-[700ms] group-hover:border-gold/45"
            aria-hidden
          />

          <span className="absolute left-0 top-0 z-10 flex h-11 w-11 items-center justify-center bg-void/80 font-display text-[1rem] tnum text-gold backdrop-blur-md">
            {String(index + 1).padStart(2, "0")}
          </span>

          {soldOut ? (
            <span className="absolute right-3 top-3 border border-alert-light/50 bg-espresso/80 px-2.5 py-1 font-sans text-[0.5625rem] font-semibold uppercase tracking-[0.2em] text-alert-light backdrop-blur-sm">
              Sold out
            </span>
          ) : null}

          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-espresso/85 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            aria-hidden
          />
        </div>

        <div className="panel hairline-draw flex flex-1 flex-col px-6 pb-7 pt-7">
          {eyebrow ? (
            <span className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.24em] text-gold/70">
              {eyebrow}
            </span>
          ) : null}

          <div className="mt-4 flex items-baseline justify-between gap-5">
            <h3 className="font-display text-[1.625rem] font-light leading-tight text-cream transition-colors duration-500 group-hover:text-gold-light">
              {title}
            </h3>
            {price ? (
              <span className="shrink-0 font-sans text-[0.875rem] tnum text-gold">
                {price}
              </span>
            ) : null}
          </div>

          {description ? (
            <p className="mt-4 text-[0.9375rem] leading-[1.85] text-latte">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
