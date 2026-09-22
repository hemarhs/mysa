import type { Metadata } from "next";

import { PageHeader } from "@/components/site/PageHeader";
import { MenuRail } from "@/components/menu/MenuRail";
import { MenuSection } from "@/components/menu/MenuSection";
import { ClosingCTA } from "@/components/home/ClosingCTA";
import { Marquee } from "@/components/ui/Marquee";
import { getMenu, getSettings } from "@/lib/db/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Coffee, specialty drinks, desserts and pastries at Mysa. Four single origins at a time, and everything sweet made in our own kitchen each morning.",
  alternates: { canonical: "/menu" },
};

export default async function MenuPage() {
  const [menu, settings] = await Promise.all([getMenu(), getSettings()]);
  const withItems = menu.filter((category) => category.items.length > 0);

  return (
    <>
      <PageHeader
        eyebrow="The board"
        heading={"What we are\npouring."}
        standfirst="The coffee changes with the season and the pastry case changes with the morning. Everything below was true when the page was last saved."
      />

      <Marquee
        items={[
          "Guji · Ethiopia",
          "Huila · Colombia",
          "Cerrado · Brazil",
          "Nyeri · Kenya",
          "Roasted in house",
        ]}
        duration={42}
      />

      {withItems.length ? (
        <>
          <MenuRail categories={withItems.map((c) => ({ slug: c.slug, name: c.name }))} />

          {withItems.map((category, index) => (
            <MenuSection
              key={category.id}
              category={category}
              currency={settings.currency}
              tone={index % 2 === 0 ? "dark" : "linen"}
            />
          ))}
        </>
      ) : (
        <div className="container-wide py-32">
          <p className="max-w-lg text-[1.0625rem] leading-[1.8] text-cream-muted">
            The menu is being updated. Please check back shortly, or write to us and
            we will tell you what is good today.
          </p>
        </div>
      )}

      <ClosingCTA />
    </>
  );
}
