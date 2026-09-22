import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/**
 * The admin area runs light on linen — a tool, not a shopfront. It shares the
 * brand's type and gold accent so it never feels like a different product.
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="admin-root" className="min-h-screen w-full bg-cream text-espresso">
      {children}
    </div>
  );
}
