"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import { detectSceneTier, type SceneTier } from "@/lib/motion";

/**
 * The lit room behind the hero type, and the gate that decides whether this
 * device also gets the 3D cup.
 *
 * The gradients below are the whole hero on a phone, on a machine without
 * WebGL, and for anyone who has asked for less motion. They are the same
 * palette and the same composition as the WebGL version, so there is no
 * second piece of artwork to fall out of sync — the canvas adds depth to a
 * picture that already works.
 *
 * The scene chunk is only imported once `detectSceneTier` has said yes, so a
 * device that will never render it never downloads three.js either.
 */
const CupScene = dynamic(() => import("./CupScene"), {
  ssr: false,
  loading: () => null,
});

export function HeroStage() {
  const [tier, setTier] = useState<SceneTier>("none");
  const [visible, setVisible] = useState(false);

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

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* --- The lamp ------------------------------------------------------- */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(68% 74% at 70% 30%, rgba(201,161,91,0.34) 0%, rgba(107,69,49,0.22) 34%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(46% 50% at 26% 84%, rgba(201,161,91,0.1) 0%, transparent 66%)",
        }}
      />
      {/* A cool sage counter-light, very faint, so the warm side has something
          to be warm against. */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(40% 44% at 92% 88%, rgba(74,90,72,0.22) 0%, transparent 70%)",
        }}
      />

      {tier !== "none" ? (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-[1800ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
            visible ? "opacity-100" : "opacity-0"
          )}
        >
          <CupScene tier={tier} />
        </div>
      ) : null}

      {/* Keeps the headline legible: dense behind the type, clearing right. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, #1c120d 0%, #1c120d 22%, rgba(28,18,13,0.72) 40%, rgba(28,18,13,0.18) 62%, transparent 78%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-espresso via-espresso/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-espresso/80 to-transparent" />
    </div>
  );
}
