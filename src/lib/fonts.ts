import localFont from "next/font/local";

/**
 * Both families are self-hosted from `src/fonts`.
 *
 * This is deliberate, and it is the fix for the build failure this project
 * used to hit: `next/font/google` performs a live HTTP request to
 * fonts.googleapis.com *during the build*. On any machine or CI runner that
 * cannot reach Google — an offline laptop, a corporate proxy, a sandbox, a
 * transient DNS blip on the build host — the build does not warn, it fails:
 *
 *     Failed to fetch Fraunces from Google Fonts.
 *
 * Shipping the .woff2 files in the repository removes that dependency
 * entirely. The build is now hermetic, and the browser still gets
 * self-hosted, preloaded, swap-safe fonts with no layout shift.
 *
 * Only the `latin` subsets are included; adding more is a matter of dropping
 * further .woff2 files in and extending the `src` arrays.
 */

/** Display face — Cormorant Garamond. The brand voice: large, tight, elegant. */
export const display = localFont({
  variable: "--font-display-face",
  display: "swap",
  preload: true,
  fallback: ["Georgia", "Times New Roman", "ui-serif", "serif"],
  adjustFontFallback: "Times New Roman",
  /* Only the three cuts the site actually sets.
   *
   * `next/font/local` emits a `<link rel="preload">` for every entry in this
   * array, on every page. The first version listed six — 300/400/500/600 and
   * two italics — which meant seven font preloads and roughly 160KB of
   * requests on a 404 page that uses two of them. The browser reported every
   * unused one as "preloaded but not used", which is Chrome politely saying
   * the bandwidth was wasted.
   *
   * Display type on this site is set at 300 throughout (26 usages, all
   * `font-light`); 400 is kept as the fallback for anything unweighted, and
   * 300 italic carries the one emphasis style the brand has. 500 and 600 were
   * never referenced and are gone. */
  src: [
    {
      path: "../fonts/cormorant-garamond-latin-300-normal.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/cormorant-garamond-latin-300-italic.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "../fonts/cormorant-garamond-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
  ],
});

/** UI face — Manrope, variable. Stays quiet underneath the display type. */
export const sans = localFont({
  variable: "--font-sans-face",
  display: "swap",
  preload: true,
  fallback: [
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
  adjustFontFallback: "Arial",
  src: [
    {
      path: "../fonts/manrope-latin-wght-normal.woff2",
      weight: "200 800",
      style: "normal",
    },
  ],
});
