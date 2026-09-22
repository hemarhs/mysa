import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { UnderlineLink } from "@/components/ui/Button";
import { TiltCard } from "@/components/ui/TiltCard";
import { formatPrice } from "@/lib/format";
import type { MenuItem } from "@/lib/db/schema";

type Props = {
  items: { item: MenuItem; categoryName: string }[];
  currency: string;
};

/**
 * Three house picks, presented as catalogue plates rather than product cards.
 *
 * Each one is a `TiltCard`: the whole plate tips a few degrees toward the
 * cursor, a gold specular glare tracks across it, and a hairline frame lights
 * up. The tilt is small on purpose — a card that swings forty degrees is a
 * toy, one that moves five is a photograph you are leaning over.
 */
export function FeaturedMenu({ items, currency }: Props) {
  if (!items.length) return null;

  return (
    <section className="relative isolate overflow-hidden bg-espresso">
      {/* One warm pool of light behind the row, echoing the hero. */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[38rem] w-[76rem] -translate-x-1/2 opacity-50 blur-[150px]"
        style={{
          background:
            "radial-gradient(ellipse, rgba(201,161,91,0.14) 0%, rgba(107,69,49,0.08) 45%, transparent 68%)",
        }}
        aria-hidden
      />

      <div className="container-wide section-y relative">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="On the board"
            heading={"What we are _proud_ of\nthis week"}
            standfirst="Three things worth ordering, chosen by whoever is on the bar. The full list runs past forty."
            className="max-w-2xl"
          />
          <Reveal delay={0.12} className="shrink-0 pb-2">
            <UnderlineLink href="/menu">See the full menu</UnderlineLink>
          </Reveal>
        </div>

        <ul className="mt-16 grid gap-10 md:mt-24 md:grid-cols-3 md:gap-7">
          {items.map(({ item, categoryName }, index) => (
            <Reveal as="li" key={item.id} delay={0.1 * index} scale>
              <TiltCard
                imageUrl={item.imageUrl}
                imageAlt={item.name}
                index={index}
                eyebrow={categoryName}
                title={item.name}
                price={formatPrice(item.priceCents, currency)}
                description={item.description}
                soldOut={item.isSoldOut}
              />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
