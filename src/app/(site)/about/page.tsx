import type { Metadata } from "next";

import { PageHeader } from "@/components/site/PageHeader";
import { ClosingCTA } from "@/components/home/ClosingCTA";
import { Figure } from "@/components/ui/Figure";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ABOUT } from "@/lib/site";
import { PHOTOS } from "@/lib/images";

export const metadata: Metadata = {
  title: "About",
  description:
    "Mysa opened on Linden Row in 2019 with fourteen seats and one espresso machine. We buy coffee directly, roast it in small lots, and make everything sweet downstairs.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow={ABOUT.hero.eyebrow}
        heading={ABOUT.hero.heading}
        standfirst={ABOUT.hero.standfirst}
      />

      {/* --- Story, set like a printed page --------------------------------- */}
      <section className="bg-linen py-24 text-ink md:py-32">
        <div className="container-wide">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <Reveal className="lg:col-span-7">
              <h2 className="display text-[clamp(2rem,4vw,3rem)]">{ABOUT.story.heading}</h2>

              <div className="mt-10 space-y-7">
                {ABOUT.story.body.map((paragraph, index) => (
                  <p
                    key={paragraph}
                    className={
                      index === 0
                        ? "text-[1.0625rem] leading-[1.9] text-ink-muted first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-serif first-letter:text-[4.25rem] first-letter:font-light first-letter:leading-[0.82] first-letter:text-gold-dim"
                        : "text-[1.0625rem] leading-[1.9] text-ink-muted"
                    }
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.1} className="lg:col-span-5">
              <Figure
                src={PHOTOS.interiorWide.src}
                alt={PHOTOS.interiorWide.alt}
                fallback={PHOTOS.interiorWide.fallback}
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="aspect-4/5"
              />
              <p className="mt-4 font-sans text-[0.8125rem] leading-relaxed text-ink-muted">
                The main room, looking back toward the bar. The lamps were rewired
                from the piano workshop that was here before us.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* --- Philosophy ------------------------------------------------------ */}
      <section className="bg-espresso py-24 md:py-32">
        <div className="container-wide">
          <SectionHeading
            eyebrow="Philosophy"
            heading={ABOUT.philosophy.heading}
            className="max-w-2xl"
          />

          <ul className="mt-16 grid gap-px border border-hairline bg-hairline sm:grid-cols-2">
            {ABOUT.philosophy.items.map((item, index) => (
              <Reveal
                as="li"
                key={item.title}
                delay={0.06 * index}
                className="bg-espresso p-9 md:p-12"
              >
                <span className="font-serif text-[0.875rem] tabular-nums text-gold/60">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-5 font-serif text-[1.5rem] font-light text-cream">
                  {item.title}
                </h3>
                <p className="mt-4 text-[0.9375rem] leading-[1.85] text-cream-muted">
                  {item.body}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* --- Sourcing -------------------------------------------------------- */}
      <section className="bg-linen py-24 text-ink md:py-32">
        <div className="container-wide">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-5">
              <Reveal>
                <span className="eyebrow flex items-center gap-3 text-gold-dim">
                  <span className="h-px w-12 bg-gold-dim/50" aria-hidden />
                  {ABOUT.sourcing.eyebrow}
                </span>
                <h2 className="display mt-6 text-[clamp(2.25rem,4.4vw,3.25rem)]">
                  {ABOUT.sourcing.heading}
                </h2>
                <div className="mt-8 space-y-6">
                  {ABOUT.sourcing.body.map((paragraph) => (
                    <p key={paragraph} className="text-[1.0625rem] leading-[1.85] text-ink-muted">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={0.12} className="mt-12">
                <Figure
                  src={PHOTOS.roasting.src}
                  alt={PHOTOS.roasting.alt}
                  fallback={PHOTOS.roasting.fallback}
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="aspect-3/2"
                />
              </Reveal>
            </div>

            <Reveal delay={0.08} className="lg:col-span-7">
              <ul className="border-t border-ink/15">
                {ABOUT.sourcing.origins.map((origin) => (
                  <li key={origin.origin} className="border-b border-ink/15 py-8">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                      <h3 className="font-serif text-[1.5rem] font-light text-ink">
                        {origin.origin}
                      </h3>
                      <span className="font-sans text-[0.75rem] uppercase tracking-[0.16em] text-gold-dim">
                        {origin.process}
                      </span>
                    </div>

                    <p className="mt-3 text-[0.9375rem] text-ink-muted">{origin.producer}</p>

                    <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-3 text-[0.875rem]">
                      <div>
                        <dt className="font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-ink-muted/70">
                          Altitude
                        </dt>
                        <dd className="mt-1 text-ink">{origin.altitude}</dd>
                      </div>
                      <div>
                        <dt className="font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-ink-muted/70">
                          In the cup
                        </dt>
                        <dd className="mt-1 text-ink">{origin.notes}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* --- People ---------------------------------------------------------- */}
      <section className="bg-espresso py-24 md:py-32">
        <div className="container-wide">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <Reveal className="lg:col-span-6">
              <Figure
                src={PHOTOS.barista.src}
                alt={PHOTOS.barista.alt}
                fallback={PHOTOS.barista.fallback}
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="aspect-4/3"
              />
            </Reveal>

            <Reveal delay={0.1} className="lg:col-span-6 lg:self-center">
              <h2 className="display text-[clamp(2rem,4vw,3rem)] text-cream">
                {ABOUT.people.heading}
              </h2>
              <p className="mt-8 max-w-lg text-[1.0625rem] leading-[1.9] text-cream-muted">
                {ABOUT.people.body}
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <ClosingCTA />
    </>
  );
}
