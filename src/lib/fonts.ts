import { Fraunces, Inter } from "next/font/google";

/**
 * Two families, self-hosted by next/font at build time — no render-blocking
 * request to Google and no layout shift.
 *
 * Both are loaded as variable fonts (no `weight` given), so the full weight
 * range is available and only one file per family is fetched.
 *
 * Fraunces carries the brand: a soft serif with enough character to feel
 * hand-set at display sizes, still composed at small ones. Inter does the
 * work — menus, body copy, admin tables.
 */
export const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  fallback: ["Georgia", "ui-serif", "serif"],
  adjustFontFallback: true,
});

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
  adjustFontFallback: true,
});
