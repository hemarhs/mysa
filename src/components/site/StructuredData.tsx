import { SITE } from "@/lib/site";

type Props = {
  settings: {
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    region?: string | null;
    postalCode?: string | null;
    country: string;
    latitude?: string | null;
    longitude?: string | null;
    phone?: string | null;
    email: string;
  };
  hours: { dayOfWeek: number; opensAt: string; closesAt: string; isClosed: boolean }[];
};

const DAY_SCHEMA = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** LocalBusiness markup, so the café shows up properly in search and maps. */
export function StructuredData({ settings, hours }: Props) {
  const data = {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    name: SITE.name,
    legalName: SITE.legalName,
    description: SITE.description,
    url: SITE.url,
    email: SITE.email,
    telephone: settings.phone ?? undefined,
    servesCuisine: ["Coffee", "Desserts", "Pastries"],
    priceRange: "$$",
    foundingDate: String(SITE.founded),
    address: {
      "@type": "PostalAddress",
      streetAddress: [settings.addressLine1, settings.addressLine2].filter(Boolean).join(", "),
      addressLocality: settings.city,
      addressRegion: settings.region ?? undefined,
      postalCode: settings.postalCode ?? undefined,
      addressCountry: settings.country,
    },
    geo:
      settings.latitude && settings.longitude
        ? {
            "@type": "GeoCoordinates",
            latitude: settings.latitude,
            longitude: settings.longitude,
          }
        : undefined,
    openingHoursSpecification: hours
      .filter((h) => !h.isClosed)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${DAY_SCHEMA[h.dayOfWeek]}`,
        opens: h.opensAt,
        closes: h.closesAt,
      })),
    hasMenu: `${SITE.url}/menu`,
    sameAs: [SITE.social.instagram],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
