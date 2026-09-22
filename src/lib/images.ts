import sources from "./photo-sources.json";

/**
 * Every photograph the marketing site uses, declared once.
 *
 * Sources live in `photo-sources.json` so a single file can be edited, and so
 * `scripts/fetch-photos.mjs` can download the same set without parsing
 * TypeScript.
 *
 * Two modes:
 *   remote  (default) — served from Unsplash, free for commercial use.
 *   local   — served from /public/images/photos, after running
 *             `npm run photos:fetch` and setting NEXT_PUBLIC_LOCAL_PHOTOS=1.
 *
 * Local is what should ship. Hotlinking someone else's CDN makes the site's
 * appearance depend on a third party staying up and keeping a photo online —
 * which is exactly how a slot goes blank on the day you show a client.
 */

export type Photo = {
  src: string;
  alt: string;
  /** On-palette texture shown while loading and if `src` ever fails. */
  fallback: string;
};

export const TEXTURE = {
  dark: "/images/texture-dark.jpg",
  warm: "/images/texture-warm.jpg",
  linen: "/images/texture-linen.jpg",
} as const;

/** Low-quality warm placeholder used as `blurDataURL` across the site. */
export const BLUR =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAIAAwDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAQFBv/EACEQAAIBAwMFAAAAAAAAAAAAAAECAwAEEQUSIQYTMUFR/8QAFQEBAQAAAAAAAAAAAAAAAAAAAgP/xAAZEQEAAwEBAAAAAAAAAAAAAAABAAIRITH/2gAMAwEAAhEDEQA/AKvW9RuLW9WKCXYuwMRtB5yfdFFFYbWZ7M//2Q==";

export const HERO_FALLBACK = "/images/hero-fallback.jpg";

/** Set NEXT_PUBLIC_LOCAL_PHOTOS=1 after running `npm run photos:fetch`. */
const USE_LOCAL = process.env.NEXT_PUBLIC_LOCAL_PHOTOS === "1";

const remote = (id: string, w = 1800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${w}`;

type Source = { id: string; alt: string; tone: "dark" | "warm" };

const entries = Object.entries(sources as Record<string, Source>).map(
  ([key, source]) =>
    [
      key,
      {
        src: USE_LOCAL ? `/images/photos/${key}.jpg` : remote(source.id),
        alt: source.alt,
        fallback: source.tone === "dark" ? TEXTURE.dark : TEXTURE.warm,
      },
    ] as const
);

export type PhotoKey = keyof typeof sources;

export const PHOTOS = Object.fromEntries(entries) as Record<PhotoKey, Photo>;
