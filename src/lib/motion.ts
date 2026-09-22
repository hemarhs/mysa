/**
 * The site's motion vocabulary, in one place.
 *
 * Three easing curves and four durations. Everything on Mysa decelerates and
 * nothing overshoots — a bounce on a luxury brand reads as a toy. Components
 * import from here rather than inventing a cubic-bezier, which is what keeps
 * a fifty-component site feeling like one hand made it.
 */

/** Matches --ease-expo in globals.css. The signature curve. */
export const EASE_EXPO = [0.16, 1, 0.3, 1] as const;
/** Matches --ease-power3. For shorter, more mechanical moves. */
export const EASE_POWER3 = [0.215, 0.61, 0.355, 1] as const;
/** Matches --ease-power2. For hovers and micro-interactions. */
export const EASE_POWER2 = [0.25, 0.46, 0.45, 0.94] as const;

export const DURATION = {
  /** Hover states, focus rings, colour changes. */
  quick: 0.35,
  /** Buttons, small reveals. */
  base: 0.6,
  /** Section reveals, image masks. */
  slow: 0.95,
  /** Curtains, hero type, page transitions. */
  grand: 1.3,
} as const;

/** CSS-side equivalents, for components that animate with classes. */
export const CSS_EASE = {
  expo: "cubic-bezier(0.16,1,0.3,1)",
  power3: "cubic-bezier(0.215,0.61,0.355,1)",
  power2: "cubic-bezier(0.25,0.46,0.45,0.94)",
} as const;

/**
 * True when the visitor has asked the operating system for less motion.
 *
 * SSR-safe: returns false on the server, where there is no matchMedia, so
 * markup rendered on the server and on the client agree on first paint and
 * the effect that actually applies the preference runs afterwards.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * A rough capability score for the current device, used to decide how much
 * 3D to build. Conservative on purpose: a dropped-frame hero on a mid-range
 * phone reads as cheap, and the 2D composition underneath is designed to
 * stand on its own.
 *
 * Returns:
 *   "none" — no WebGL, reduced motion, save-data, or a very weak device
 *   "lite" — render, but with fewer particles, no post-processing, dpr 1.5
 *   "full" — the whole scene
 */
export type SceneTier = "none" | "lite" | "full";

export function detectSceneTier(): SceneTier {
  if (typeof window === "undefined") return "none";

  // Explicit override, e.g. /?scene=lite. Useful for checking the low-end
  // composition on a workstation, and for reviewing the hero on a machine
  // whose reported core count under-sells it (headless browsers report two).
  const override = new URLSearchParams(window.location.search).get("scene");
  if (override === "off" || override === "none") return "none";
  if (override === "lite") return "lite";
  if (override === "full") return "full";

  if (prefersReducedMotion()) return "none";

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };

  if (nav.connection?.saveData) return "none";
  if (nav.connection?.effectiveType && /(^|-)2g/.test(nav.connection.effectiveType)) {
    return "none";
  }

  // No WebGL at all — nothing to negotiate.
  if (!hasWebGL()) return "none";

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.matchMedia("(max-width: 900px)").matches;

  /* Phones and tablets get no WebGL at all.
   *
   * Two reasons, and the first is the honest one: the hero scene exists to
   * respond to a pointer, and a touch device has no pointer to respond to —
   * the parallax, the camera lean and the dust all have nothing to track, so
   * the visitor pays for a feature they cannot use. The second is that
   * three.js is roughly 180KB gzipped, which is a lot to spend on a phone for
   * a decoration. They get the photograph, which is the same picture.
   */
  if (coarse || narrow) return "none";

  const memory = typeof nav.deviceMemory === "number" ? nav.deviceMemory : 8;
  const cores =
    typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : 8;

  if (memory < 4 || cores < 4) return "none";
  if (memory < 8 || cores < 8) return "lite";

  return "full";
}

/**
 * Probes for a WebGL context and immediately throws the probe away.
 *
 * The explicit `loseContext()` matters: browsers cap the number of live
 * WebGL contexts per page (typically 8–16), and a probe that is left for the
 * garbage collector counts against that cap. Leaking probes is one of the
 * classic ways a page ends up with a blank canvas after a few navigations.
 */
export function hasWebGL(): boolean {
  if (typeof document === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ??
      canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
