"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import { detectSceneTier, type SceneTier } from "@/lib/motion";

/**
 * The hero: a cut-out photograph with moving air behind it.
 *
 * The important thing here is what *doesn't* happen. An earlier version
 * painted the photograph twice — first as an <img>, then again as a WebGL
 * surface that cross-faded over the top of it. Two renderers, two crops, two
 * colour pipelines, and on every reload you watched one hand over to the
 * other. That is the flash.
 *
 * So there is one photograph now, and it is this <img>. It never moves aside
 * and nothing fades over it. It is also the Largest Contentful Paint element,
 * which is exactly what you want it to be: a priority-fetched next/image is
 * the fastest large paint a browser knows how to do, and a canvas can never
 * be an LCP candidate at all.
 *
 * Behind it — literally behind, at a lower z — a transparent canvas drops the
 * photograph's own coffee beans through the air and lifts its own steam off
 * the cup. Because the image is an alpha cut-out with no background, two
 * things follow for free:
 *
 *   • the beans and the steam are visible through every transparent pixel,
 *     which is all of the air, and
 *   • the cup occludes them perfectly, because it is opaque. A bean falling
 *     behind the rim disappears behind the rim.
 *
 * And because the beans enter from above the frame and the steam starts at
 * zero opacity, the canvas's arrival — a beat after first paint, once the
 * browser is idle — changes nothing on screen. The air just starts moving.
 *
 * On a phone, on a machine without WebGL and for anyone who has asked for
 * less motion, the canvas never mounts. The hero is the photograph, which is
 * the same photograph either way.
 */
const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => null,
});

/** Shared with HeroScene: the column the photograph occupies on a wide
 *  screen. Both have to agree or the beans fall past the wrong cup. */
const PLATE_CLASS = "md:w-[64%]";

export function HeroStage() {
  const [tier, setTier] = useState<SceneTier>("none");

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

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* --- Moving air, behind the photograph --------------------------- */}
      {tier !== "none" ? <HeroScene tier={tier} /> : null}

      {/* --- The photograph ---------------------------------------------- */}
      <div className={cn("absolute inset-y-0 right-0 w-full", PLATE_CLASS)}>
        <Image
          src="/images/hero-cup.webp"
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="(max-width: 768px) 100vw, 64vw"
          /* No blur placeholder. The plate is a cut-out with an alpha channel
             and the placeholder is an opaque blurred rectangle, so for the
             few hundred milliseconds before the image decodes you would see
             precisely the hard-edged box this whole approach exists to
             avoid. Against a near-black page, arriving without a placeholder
             is invisible; arriving with one is not. */
          className="object-cover object-[58%_58%]"
        />
      </div>

      {/* --- The lamp ------------------------------------------------------
          A warm pool over the cup and a faint sage counter-light low right,
          so the warm side has something to be warm against.

          Plain alpha, not `mix-blend-screen`. A blended layer above an
          animated one cannot be composited on its own: the browser has to
          re-rasterise everything beneath it on every frame. Over a near-black
          ground the two look all but identical. */}
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
    </div>
  );
}
