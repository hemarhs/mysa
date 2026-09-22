"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { BLUR, TEXTURE } from "@/lib/images";
import { cn } from "@/lib/cn";

type FigureProps = {
  src: string;
  alt: string;
  /** Shown while loading and if `src` fails to load. */
  fallback?: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  /** Slow zoom on hover — used on cards and gallery tiles. */
  zoomOnHover?: boolean;
  /** Continuous, very slow Ken Burns drift. For hero and feature plates. */
  kenBurns?: boolean;
  /** Mask-wipe the image in from below as it enters view. */
  reveal?: boolean;
  revealDelay?: number;
  /** Warm grade strength, 0–1. Every photo gets a little; heroes get more. */
  grade?: number;
  /** A hairline gold frame, inset slightly. Used on editorial plates. */
  framed?: boolean;
};

/**
 * Every photograph on the site goes through here.
 *
 * Three rules govern it, all learned the hard way:
 *
 *  1. **A photograph must never be hidden by its own entrance animation.**
 *     The reveal is driven by a plain IntersectionObserver with a timeout
 *     that forces the visible state, so a missed observer callback degrades
 *     to "no animation", never to "no image".
 *  2. **A dead URL must look designed.** An on-palette texture sits behind
 *     every image and the component swaps to it on error, so a broken link
 *     shows a warm panel rather than a broken-image icon.
 *  3. **The set must read as one shoot.** A gold soft-light wash and a
 *     shadow lift are applied to every photograph, which is what pulls
 *     mismatched sources into a single warm grade.
 */
export function Figure({
  src,
  alt,
  fallback = TEXTURE.dark,
  className,
  imageClassName,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
  zoomOnHover = false,
  kenBurns = false,
  reveal = true,
  revealDelay = 0,
  grade = 0.1,
  framed = false,
}: FigureProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // Priority images (the hero) are shown immediately — they are the LCP.
  const [revealed, setRevealed] = useState(!reveal || priority);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (revealed) return;

    const element = containerRef.current;
    const show = () => setRevealed(true);

    if (!element || typeof IntersectionObserver === "undefined") {
      show();
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      show();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          show();
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.01 }
    );

    observer.observe(element);

    // Safety net: whatever happens with the observer, the image becomes
    // visible. An unrevealed photograph is a far worse bug than a missed
    // animation.
    const failsafe = window.setTimeout(show, 2000);

    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
    };
  }, [revealed]);

  return (
    <div
      ref={containerRef}
      data-motion
      className={cn(
        "relative overflow-hidden bg-roast",
        framed && "ring-1 ring-gold/18 ring-offset-0",
        className
      )}
      style={{
        backgroundImage: `url(${fallback})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* The mask. Clip-path wipes the frame open from the bottom while the
          contents settle back from a slight overscale — two cheap, composited
          properties that together read as a curtain rather than a fade. */}
      <div
        className="absolute inset-0 transition-[clip-path,transform] duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
        style={{
          clipPath: revealed ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)",
          transform: revealed ? "scale(1)" : "scale(1.08)",
          transitionDelay: `${revealDelay}s`,
        }}
      >
        <div
          className={cn(
            "absolute inset-0",
            kenBurns && "ken-burns",
            zoomOnHover &&
              "transition-transform duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07]"
          )}
        >
          <Image
            src={failed ? fallback : src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            // Never lazy: the wrapper is briefly clipped, and a lazy loader
            // can read that as off-screen and refuse to fetch.
            loading="eager"
            placeholder="blur"
            blurDataURL={BLUR}
            onError={() => setFailed(true)}
            onLoad={() => setLoaded(true)}
            className={cn(
              "object-cover transition-opacity duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
              loaded ? "opacity-100" : "opacity-0",
              imageClassName
            )}
          />
        </div>
      </div>

      {/* The warm grade: a gold soft-light wash, plus a whisper of espresso
          in the shadows so nothing sits colder than the page around it. */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        style={{ backgroundColor: `rgba(201, 161, 91, ${grade})` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply"
        style={{
          background:
            "linear-gradient(to top, rgba(28,18,13,0.55) 0%, rgba(28,18,13,0) 55%)",
        }}
        aria-hidden
      />

      {framed ? (
        <span
          className="pointer-events-none absolute inset-3 border border-gold/20"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
