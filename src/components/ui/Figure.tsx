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
  /** Slow zoom on hover, used on the gallery and menu previews. */
  zoomOnHover?: boolean;
  /** Wipe the image in from below as it enters view. */
  reveal?: boolean;
  revealDelay?: number;
};

/**
 * Every photograph on the site goes through here.
 *
 * Two rules govern this component, both learned the hard way:
 *
 *  1. A photograph must never be hidden by its own entrance animation. The
 *     reveal is driven by a plain IntersectionObserver with a timeout that
 *     forces the visible state, so a missed observer callback degrades to
 *     "no animation", never to "no image".
 *  2. A dead URL must look designed. An on-palette texture sits behind every
 *     image and the component swaps to it on error, so a broken link shows a
 *     warm panel rather than a broken-image icon.
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
  reveal = true,
  revealDelay = 0,
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
      className={cn("relative overflow-hidden bg-roast", className)}
      style={{
        backgroundImage: `url(${fallback})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className="absolute inset-0 transition-[clip-path,transform] duration-[1300ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
        style={{
          clipPath: revealed ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)",
          transform: revealed ? "scale(1)" : "scale(1.1)",
          transitionDelay: `${revealDelay}s`,
        }}
      >
        <Image
          src={failed ? fallback : src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          // Never lazy: the wrapper is briefly clipped, and a lazy loader can
          // read that as off-screen and refuse to fetch.
          loading="eager"
          placeholder="blur"
          blurDataURL={BLUR}
          onError={() => setFailed(true)}
          onLoad={() => setLoaded(true)}
          className={cn(
            "object-cover transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
            loaded ? "opacity-100" : "opacity-0",
            zoomOnHover && "group-hover:scale-[1.05]",
            imageClassName
          )}
        />
      </div>

      {/* A whisper of warmth over every photograph, so the set reads as one
          shoot even when the sources differ. */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        style={{ backgroundColor: "rgba(200, 161, 101, 0.10)" }}
        aria-hidden
      />
    </div>
  );
}
