"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { BLUR } from "@/lib/images";
import { detectSceneTier, type SceneTier } from "@/lib/motion";

/**
 * The hero: a photograph, brought to life.
 *
 * The plate is a real photograph — a white cup on a bed of roasted beans,
 * beans falling into it, steam coming off the surface. A procedural cup was
 * the first approach and it was the wrong one: a render of a cup either
 * convinces or it doesn't, and next to a real photograph it never does.
 *
 * What the WebGL layer adds is the thing a still cannot do — beans that keep
 * falling, steam that keeps drifting, and dust that answers the cursor. The
 * photograph itself also drifts and parallaxes with the pointer, so the whole
 * frame has depth rather than sitting flat behind the type.
 *
 * Everything above the photograph is an enhancement. On a phone, on a machine
 * without WebGL, and for anyone who has asked for less motion, the photograph
 * and its lighting are the entire hero — and they are enough.
 */
const HeroParticles = dynamic(() => import("./HeroParticles"), {
  ssr: false,
  loading: () => null,
});

export function HeroStage() {
  const [tier, setTier] = useState<SceneTier>("none");
  const [visible, setVisible] = useState(false);
  const plateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const decided = detectSceneTier();
    if (decided === "none") return;

    // Wait for the browser to be idle, so the canvas never competes with the
    // first paint or with font loading.
    const start = () => setTier(decided);
    const idle =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(start, { timeout: 2400 })
        : window.setTimeout(start, 1000);

    return () => {
      if (typeof window.cancelIdleCallback === "function" && typeof idle === "number") {
        window.cancelIdleCallback(idle);
      } else {
        window.clearTimeout(idle as number);
      }
    };
  }, []);

  useEffect(() => {
    if (tier === "none") return;
    const timer = window.setTimeout(() => setVisible(true), 140);
    return () => window.clearTimeout(timer);
  }, [tier]);

  /**
   * Pointer parallax on the plate itself.
   *
   * Written straight to the node inside a rAF — a pointermove handler that
   * sets React state would re-render a subtree containing a next/image sixty
   * times a second. The movement is tiny (a dozen pixels at most): enough to
   * make the frame feel like it has depth, never enough to notice as an
   * effect.
   */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const node = plateRef.current;
    if (!node) return;

    // The whole loop lives inside the effect. A self-referencing
    // `useCallback` would have to read itself before it is declared, which is
    // both a lint error and a real hazard: the recursive reference captures
    // whichever version of the function existed on the first frame.
    let frame = 0;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    const onMove = (event: PointerEvent) => {
      target.x = (event.clientX / window.innerWidth - 0.5) * -26;
      target.y = (event.clientY / window.innerHeight - 0.5) * -18;
    };

    const tick = () => {
      current.x += (target.x - current.x) * 0.06;
      current.y += (target.y - current.y) * 0.06;
      node.style.transform = `translate3d(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px, 0) scale(1.06)`;
      frame = window.requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    frame = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* --- The plate ------------------------------------------------------
          Anchored right and bled off the top and bottom edges, so the cup
          sits in the right third and the type has the left two-thirds. */}
      <div className="absolute inset-y-0 right-0 w-full md:w-[68%] lg:w-[62%]">
        {/* Two wrappers, not one. The parallax writes an inline transform
            every frame, and an inline transform beats a CSS animation on the
            same element — putting both on one node silently kills the drift
            the moment the pointer moves. */}
        <div
          ref={plateRef}
          className="absolute inset-0 will-change-transform"
          style={{ transform: "scale(1.06)" }}
        >
          <div className="absolute inset-0 motion-safe:animate-[hero-drift_30s_cubic-bezier(0.25,0.46,0.45,0.94)_alternate_infinite]">
          <Image
            src="/images/hero-cup.jpg"
            alt=""
            fill
            // The LCP element on the home page: fetched immediately, at high
            // priority, and never lazily.
            priority
            fetchPriority="high"
            sizes="(max-width: 768px) 100vw, 68vw"
            placeholder="blur"
            blurDataURL={BLUR}
            className="object-cover object-[58%_58%] [filter:saturate(1.06)_contrast(1.05)]"
          />
          </div>
        </div>
      </div>

      {/* --- The lamp -------------------------------------------------------
          A warm pool over the cup and a faint sage counter-light low right,
          so the warm side has something to be warm against. */}
      <div
        className="absolute inset-0 mix-blend-screen"
        style={{
          background:
            "radial-gradient(42% 46% at 72% 46%, rgba(201,161,91,0.16) 0%, rgba(107,69,49,0.07) 42%, transparent 72%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(36% 40% at 94% 90%, rgba(74,90,72,0.2) 0%, transparent 70%)",
        }}
      />

      {/* --- The live layer -------------------------------------------------- */}
      {tier !== "none" ? (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-[1800ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
            visible ? "opacity-100" : "opacity-0"
          )}
        >
          <HeroParticles tier={tier} />
        </div>
      ) : null}

      {/* --- Scrims ----------------------------------------------------------
          Dense behind the headline, clearing to the right so the cup is never
          veiled. These are what make the type legible over a photograph at
          every viewport width, and they are tuned per breakpoint. */}
      <div
        className="pointer-events-none absolute inset-0 md:hidden"
        style={{
          background:
            "linear-gradient(to bottom, rgba(18,11,7,0.92) 0%, rgba(18,11,7,0.76) 42%, rgba(18,11,7,0.55) 70%, rgba(18,11,7,0.9) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
        style={{
          background:
            "linear-gradient(to right, #120b07 0%, #120b07 20%, rgba(18,11,7,0.88) 34%, rgba(18,11,7,0.45) 52%, rgba(18,11,7,0.08) 70%, transparent 82%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-void via-void/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-void/85 to-transparent" />

      <style>{`
        @keyframes hero-drift {
          from { transform: scale(1) translate3d(0, 0, 0); }
          to   { transform: scale(1.07) translate3d(-1.4%, -1.8%, 0); }
        }
      `}</style>
    </div>
  );
}
