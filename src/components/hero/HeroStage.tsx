"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import { BLUR } from "@/lib/images";
import { detectSceneTier, type SceneTier } from "@/lib/motion";

/**
 * The hero: a photograph that becomes a three-dimensional scene.
 *
 * Two layers, and the handover between them is the whole design:
 *
 *   • The `<Image>` below paints first. It is the LCP element — a normal,
 *     priority-fetched, blur-placeholdered next/image, which is the fastest
 *     large paint the browser knows how to do. A WebGL canvas can never be
 *     an LCP candidate, so starting with one would cost real Lighthouse
 *     points for a hero nobody has seen yet.
 *
 *   • Once the browser is idle and the device has been judged capable,
 *     `HeroScene` mounts underneath, renders the same photograph as a
 *     depth-displaced surface with beans and steam falling in front of and
 *     behind it, and the flat image cross-fades away.
 *
 * On a phone, on a machine without WebGL, and for anyone who has asked for
 * less motion, the handover simply never happens and the photograph is the
 * hero. That is not a degraded state — it is the same picture.
 */
const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => null,
});

export function HeroStage() {
  const [tier, setTier] = useState<SceneTier>("none");
  const [sceneVisible, setSceneVisible] = useState(false);
  const [plateLoaded, setPlateLoaded] = useState(false);

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
    // A beat after the chunk mounts, so the first WebGL frame has landed
    // before the flat image starts to leave. Swapping them on the same frame
    // shows a hole.
    const timer = window.setTimeout(() => setSceneVisible(true), 480);
    return () => window.clearTimeout(timer);
  }, [tier]);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* --- Flat plate: first paint, and the permanent fallback ---------- */}
      <div
        className={cn(
          "absolute inset-y-0 right-0 w-full transition-opacity duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] md:w-[70%] lg:w-[64%]",
          sceneVisible ? "opacity-0" : "opacity-100"
        )}
      >
        {/* The drift only starts once the photograph has actually decoded.
            Animating a transform over an image that is still arriving makes
            the browser rasterise it repeatedly while it is trying to paint it
            for the first time — the animation competes with the very paint
            that LCP measures. Waiting costs nothing: there is nothing to
            drift until the picture is there. */}
        <div
          className={cn(
            "absolute inset-0",
            plateLoaded &&
              "motion-safe:animate-[hero-drift_30s_cubic-bezier(0.25,0.46,0.45,0.94)_alternate_infinite]"
          )}
        >
          <Image
            src="/images/hero-cup.jpg"
            alt=""
            fill
            priority
            fetchPriority="high"
            sizes="(max-width: 768px) 100vw, 70vw"
            placeholder="blur"
            blurDataURL={BLUR}
            onLoad={() => setPlateLoaded(true)}
            // The warm grade is baked into the JPEG rather than applied as a
            // CSS filter: a filter on a 1080px-wide image is re-applied by the
            // compositor on every paint, and this one never changes.
            className="object-cover object-[58%_58%]"
          />
        </div>

        {/* The photograph's black ground is keyed out per-pixel in the WebGL
            version. Here it is feathered with a mask instead, so the flat
            fallback has no visible rectangle either. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 92% at 55% 60%, transparent 38%, rgba(18,11,7,0.5) 76%, #120b07 100%)",
          }}
        />
      </div>

      {/* --- The scene ---------------------------------------------------- */}
      {tier !== "none" ? (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
            sceneVisible ? "opacity-100" : "opacity-0"
          )}
        >
          <HeroScene tier={tier} />
        </div>
      ) : null}

      {/* --- The lamp ------------------------------------------------------
          A warm pool over the cup and a faint sage counter-light low right,
          so the warm side has something to be warm against. */}
      {/* Plain alpha, not `mix-blend-screen`.
          A blended layer sitting above an animated one cannot be composited
          independently: the browser has to re-rasterise everything beneath it
          on every frame of the drift, which on this hero meant repainting a
          1080px photograph sixty times a second. Over a near-black ground the
          two look all but identical. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(40% 44% at 70% 48%, rgba(201,161,91,0.16) 0%, rgba(107,69,49,0.07) 42%, transparent 72%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          background:
            "radial-gradient(36% 40% at 94% 90%, rgba(74,90,72,0.18) 0%, transparent 70%)",
        }}
      />

      {/* --- Scrims --------------------------------------------------------
          Dense behind the headline, clearing to the right so the cup is never
          veiled. Tuned per breakpoint, because the composition stacks on a
          phone and sits side by side on a desktop. */}
      <div
        className="pointer-events-none absolute inset-0 md:hidden"
        style={{
          background:
            "linear-gradient(to bottom, rgba(18,11,7,0.92) 0%, rgba(18,11,7,0.74) 42%, rgba(18,11,7,0.5) 70%, rgba(18,11,7,0.92) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
        style={{
          background:
            "linear-gradient(to right, #120b07 0%, rgba(18,11,7,0.97) 17%, rgba(18,11,7,0.8) 31%, rgba(18,11,7,0.36) 49%, rgba(18,11,7,0.05) 68%, transparent 80%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-void via-void/65 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-void/80 to-transparent" />

      <style>{`
        @keyframes hero-drift {
          from { transform: scale(1) translate3d(0, 0, 0); }
          to   { transform: scale(1.07) translate3d(-1.4%, -1.8%, 0); }
        }
      `}</style>
    </div>
  );
}
