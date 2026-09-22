import { Figure } from "@/components/ui/Figure";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { UnderlineLink } from "@/components/ui/Button";
import { TEXTURE } from "@/lib/images";
import { formatPrice } from "@/lib/format";
import type { MenuItem } from "@/lib/db/schema";

type Props = {
  items: { item: MenuItem; categoryName: string }[];
  currency: string;
};

export function FeaturedMenu({ items, currency }: Props) {
  if (!items.length) return null;

  return (
    <section className="relative bg-espresso py-28 md:py-40">
      {/* One warm pool of light behind the row, echoing the hero. */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[38rem] w-[70rem] -translate-x-1/2 opacity-40 blur-[140px]"
        style={{
          background:
            "radial-gradient(ellipse, rgba(200,161,101,0.16) 0%, transparent 65%)",
        }}
        aria-hidden
      />

      <div className="container-wide relative">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="On the board"
            heading={"What we are proud of\nthis week"}
            standfirst="Three things worth ordering, chosen by whoever is on the bar. The full list runs past forty."
            className="max-w-2xl"
          />
          <Reveal delay={0.1} className="shrink-0 pb-2">
            <UnderlineLink href="/menu">See the full menu</UnderlineLink>
          </Reveal>
        </div>

        <ul className="mt-16 grid gap-10 md:mt-24 md:grid-cols-3 md:gap-8">
          {items.map(({ item, categoryName }, index) => (
            <Reveal as="li" key={item.id} delay={0.09 * index} className="group">
              <article className="flex h-full flex-col">
                <div className="relative">
                  <Figure
                    src={item.imageUrl ?? TEXTURE.warm}
                    alt={item.name}
                    fallback={TEXTURE.warm}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    zoomOnHover
                    revealDelay={index * 0.08}
                    className="aspect-4/5"
                  />

                  {/* Plate number, set over the image corner like a catalogue. */}
                  <span className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center bg-espresso/85 font-serif text-[0.875rem] tabular-nums text-gold backdrop-blur-sm">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-espresso/80 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                    aria-hidden
                  />
                </div>

                <div className="hairline-draw flex flex-1 flex-col border-t border-hairline pb-5 pt-6">
                  <span className="eyebrow text-gold/70">{categoryName}</span>

                  <div className="mt-4 flex items-baseline justify-between gap-5">
                    <h3 className="font-serif text-[1.5rem] font-light leading-tight text-cream transition-colors duration-500 group-hover:text-gold-light">
                      {item.name}
                    </h3>
                    <span className="shrink-0 font-sans text-[0.9375rem] tabular-nums text-gold">
                      {formatPrice(item.priceCents, currency)}
                    </span>
                  </div>

                  {item.description ? (
                    <p className="mt-4 text-[0.9375rem] leading-[1.8] text-cream-muted">
                      {item.description}
                    </p>
                  ) : null}
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
