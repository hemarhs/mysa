import type { Metadata } from "next";

import { PageHeader } from "@/components/site/PageHeader";
import { ClosingCTA } from "@/components/home/ClosingCTA";
import { Figure } from "@/components/ui/Figure";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SplitText } from "@/components/ui/SplitText";
import { Eyebrow, PlateNumber, Flourish } from "@/components/ui/Ornament";
import { Marquee } from "@/components/ui/Marquee";
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
        heading={"A room built\nfor _staying._"}
        standfirst={ABOUT.hero.standfirst}
        plate={PHOTOS.interiorWide}
        margin="Est. 2019"
      />

      {/* --- Story, set like a printed page --------------------------------- */}
      <section className="luxe relative text-espresso">
        <div className="container-wide section-y">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-7">
              <SplitText
                as="h2"
                lines={[ABOUT.story.heading]}
                className="display text-[clamp(1.875rem,4vw,3rem)] text-espresso"
                lineClassName="pb-[0.14em] -mb-[0.1em]"
                stagger={0.05}
              />

              <Reveal delay={0.1} className="mt-10 space-y-7">
                {ABOUT.story.body.map((paragraph, index) => (
                  <p
                    key={paragraph}
                    className={
                      index === 0
                        ? "text-[var(--step-1)] leading-[1.95] text-mocha first-letter:float-left first-letter:mr-3.5 first-letter:mt-1.5 first-letter:font-display first-letter:text-[4.75rem] first-letter:font-light first-letter:leading-[0.78] first-letter:text-gold-ink"
                        : "text-[var(--step-1)] leading-[1.95] text-mocha"
                    }
                  >
                    {paragraph}
                  </p>
                ))}
              </Reveal>
            </div>

            <Reveal delay={0.14} className="lg:col-span-5" scale>
              <Figure
                src={PHOTOS.interiorSeats.src}
                alt={PHOTOS.interiorSeats.alt}
                fallback={PHOTOS.interiorSeats.fallback}
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="aspect-4/5 shadow-warm"
                grade={0.08}
                kenBurns
              />
              <p className="mt-5 max-w-xs font-sans text-[0.8125rem] leading-[1.7] text-mocha">
                The main room, looking back toward the bar. The lamps were rewired
                from the piano workshop that was here before us.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* --- Philosophy ------------------------------------------------------ */}
      <section className="lustre relative bg-espresso">
        <div className="container-wide section-y">
          <SectionHeading
            eyebrow="Philosophy"
            heading={"What we _believe._"}
            className="max-w-2xl"
          />

          {/* A hairline grid: one gold rule between every cell, nothing more. */}
          <ul className="mt-16 grid gap-px border border-hairline bg-hairline sm:grid-cols-2">
            {ABOUT.philosophy.items.map((item, index) => (
              <Reveal
                as="li"
                key={item.title}
                delay={0.07 * index}
                className="group relative overflow-hidden bg-espresso p-9 transition-colors duration-700 hover:bg-roast/50 md:p-12"
              >
                <PlateNumber value={index + 1} />
                <h3 className="mt-6 font-display text-[1.625rem] font-light text-cream transition-colors duration-500 group-hover:text-gold-light">
                  {item.title}
                </h3>
                <p className="mt-5 max-w-sm text-[0.9375rem] leading-[1.9] text-latte">
                  {item.body}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <Marquee
        items={[
          "Slow is a feature",
          "Short menus, changed often",
          "Everything made here",
          "The room counts",
        ]}
        duration={50}
      />

      {/* --- Sourcing -------------------------------------------------------- */}
      <section className="luxe relative text-espresso">
        <div className="container-wide section-y">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-5">
              <Reveal>
                <Eyebrow tone="light">{ABOUT.sourcing.eyebrow}</Eyebrow>
              </Reveal>

              <SplitText
                as="h2"
                lines={["Four farms,", "_named._"]}
                className="display mt-7 text-[clamp(2rem,4.2vw,3.25rem)] text-espresso"
                lineClassName="pb-[0.14em] -mb-[0.1em]"
                stagger={0.06}
              />

              <Reveal delay={0.12} className="mt-8 space-y-6">
                {ABOUT.sourcing.body.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="max-w-md text-[var(--step-0)] leading-[1.9] text-mocha"
                  >
                    {paragraph}
                  </p>
                ))}
              </Reveal>

              <Reveal delay={0.18} className="mt-12" scale>
                <Figure
                  src={PHOTOS.roasting.src}
                  alt={PHOTOS.roasting.alt}
                  fallback={PHOTOS.roasting.fallback}
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="aspect-3/2 shadow-warm"
                  grade={0.08}
                />
              </Reveal>
            </div>

            <Reveal delay={0.1} className="lg:col-span-7">
              <ul className="border-t border-hairline-ink">
                {ABOUT.sourcing.origins.map((origin, index) => (
                  <li
                    key={origin.origin}
                    className="group border-b border-hairline-ink py-9 transition-colors duration-700"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                      <div className="flex items-baseline gap-5">
                        <span
                          className="font-sans text-[0.625rem] font-semibold tracking-[0.2em] tnum text-gold-ink/50"
                          aria-hidden
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <h3 className="font-display text-[1.625rem] font-light text-espresso transition-colors duration-500 group-hover:text-gold-ink">
                          {origin.origin}
                        </h3>
                      </div>
                      <span className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-gold-ink">
                        {origin.process}
                      </span>
                    </div>

                    <p className="mt-3.5 pl-0 text-[0.9375rem] text-mocha sm:pl-10">
                      {origin.producer}
                    </p>

                    <dl className="mt-5 flex flex-wrap gap-x-12 gap-y-4 text-[0.875rem] sm:pl-10">
                      <div>
                        <dt className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-mocha/70">
                          Altitude
                        </dt>
                        <dd className="mt-1.5 text-espresso">{origin.altitude}</dd>
                      </div>
                      <div>
                        <dt className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-mocha/70">
                          In the cup
                        </dt>
                        <dd className="mt-1.5 text-espresso">{origin.notes}</dd>
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
      <section className="lustre relative bg-espresso">
        <div className="container-wide section-y">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <Reveal className="lg:col-span-6" scale>
              <Figure
                src={PHOTOS.barista.src}
                alt={PHOTOS.barista.alt}
                fallback={PHOTOS.barista.fallback}
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="aspect-4/3 shadow-warm"
                framed
                kenBurns
              />
            </Reveal>

            <div className="lg:col-span-6 lg:self-center">
              <SplitText
                as="h2"
                lines={["Who is _here._"]}
                className="display text-[clamp(1.875rem,4vw,3rem)] text-cream"
                lineClassName="pb-[0.14em] -mb-[0.1em]"
                stagger={0.06}
              />
              <Reveal delay={0.14}>
                <p className="mt-9 max-w-lg text-[var(--step-1)] leading-[1.95] text-latte">
                  {ABOUT.people.body}
                </p>
                <Flourish className="mt-12 max-w-xs" />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <ClosingCTA />
    </>
  );
}
