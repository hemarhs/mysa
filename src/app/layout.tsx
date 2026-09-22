import type { Metadata, Viewport } from "next";

import { display, sans } from "@/lib/fonts";
import { SITE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "specialty coffee",
    "single origin",
    "dessert bar",
    "Hayes Valley café",
    "San Francisco coffee",
    "pastries",
  ],
  authors: [{ name: SITE.legalName }],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#1c120d",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  // Pinch-zoom stays available: capping it is an accessibility failure, and
  // nothing in this design depends on the viewport scale being fixed.
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-espresso text-cream antialiased">{children}</body>
    </html>
  );
}
