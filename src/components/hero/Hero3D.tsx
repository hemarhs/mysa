"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";

import { BLUR, HERO_FALLBACK } from "@/lib/images";
import { cn } from "@/lib/cn";

/** Loaded only after we have decided the device should get it. */
const CupScene = dynamic(() => import("./CupScene"), { ssr: false, loading: () => null });

/**
 * Decides whether this device gets the WebGL hero or the static photograph.
 *
 * The bar is deliberately conservative: a dropped-frame hero on a mid-range
 * phone reads as cheap, and the static image is good enough that nobody is
 * missing out.
 */
function shouldRender3D(): boolean {
  if (typeof window === "undefined") return false;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  // Phones and small tablets: static image, always.
  if (window.matchMedia("(max-width: 900px)").matches) return false;
  // Coarse pointer means there is no cursor to parallax toward anyway.
  if (window.matchMedia("(pointer: coarse)").matches) return false;

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };

  if (nav.connection?.saveData) return false;
  if (nav.connection?.effectiveType && /2g/.test(nav.connection.effectiveType)) return false;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) return false;
  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency < 4) return false;

  // Last check: can this browser actually give us a WebGL context?
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    if (!gl) return false;
    (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function Hero3D() {
  const [mode, setMode] = useState<"image" | "3d">("image");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!shouldRender3D()) return;

    // Wait for the browser to be idle so the canvas never competes with
    // first paint or font loading.
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(() => setMode("3d"), { timeout: 2200 })
      : window.setTimeout(() => setMode("3d"), 900);

    return () => {
      if (window.cancelIdleCallback && typeof idle === "number") window.cancelIdleCallback(idle);
      else clearTimeout(idle as number);
    };
  }, []);

  // Cross-fade the canvas in over the photograph rather than swapping hard.
  useEffect(() => {
    if (mode !== "3d") return;
    const t = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(t);
  }, [mode]);

  return (
    <div className="absolute inset-0" aria-hidden>
      <Image
        src={HERO_FALLBACK}
        alt=""
        fill
        priority
        sizes="100vw"
        placeholder="blur"
        blurDataURL={BLUR}
        className={cn(
          "object-cover transition-opacity duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          visible ? "opacity-0" : "opacity-100"
        )}
      />

      {/* The warm key-light pool, so the right side is lit whether the layer
          showing is the photograph or the canvas. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 70% at 68% 34%, rgba(150,102,48,0.42) 0%, rgba(96,64,30,0.18) 38%, transparent 72%)",
        }}
        aria-hidden
      />

      {mode === "3d" ? (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            visible ? "opacity-100" : "opacity-0"
          )}
        >
          <CupScene />
        </div>
      ) : null}

      {/* Keeps the headline legible without dimming the object itself: the
          scrim is dense behind the type and clears before the cup. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, #14100d 0%, #14100d 26%, rgba(20,16,13,0.62) 42%, rgba(20,16,13,0.12) 58%, transparent 70%)",
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-espresso to-transparent" aria-hidden />
    </div>
  );
}
