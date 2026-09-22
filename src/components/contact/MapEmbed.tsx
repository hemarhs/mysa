import { cn } from "@/lib/cn";

type Props = {
  latitude?: string | null;
  longitude?: string | null;
  mapUrl?: string | null;
  label: string;
  className?: string;
};

/**
 * OpenStreetMap embed — no API key, no billing account, no third-party
 * tracking cookie on a café website. Filtered to sit inside the palette
 * rather than punching a bright white rectangle through a dark page.
 */
export function MapEmbed({ latitude, longitude, mapUrl, label, className }: Props) {
  if (!latitude || !longitude) return null;

  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const d = 0.0055;
  const bbox = [lon - d, lat - d / 2, lon + d, lat + d / 2].join("%2C");
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;

  return (
    <div className={cn("relative border-t border-hairline bg-roast", className)}>
      <iframe
        src={src}
        title={`Map showing ${label}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-[22rem] w-full grayscale-[0.55] invert-[0.92] hue-rotate-180 contrast-[0.92] brightness-[0.95] md:h-[30rem]"
      />

      {/* Warms the filtered map back toward the brand palette. */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-multiply"
        style={{ backgroundColor: "rgba(200, 161, 101, 0.10)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-espresso to-transparent"
        aria-hidden
      />

      {mapUrl ? (
        <a
          href={mapUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="absolute bottom-6 right-6 border border-gold/40 bg-espresso/90 px-6 py-3 font-sans text-[0.75rem] font-medium uppercase tracking-[0.16em] text-gold backdrop-blur transition-all duration-500 hover:border-gold hover:bg-gold hover:text-espresso"
        >
          Open in maps
        </a>
      ) : null}
    </div>
  );
}
