import { ButtonLink } from "@/components/ui/Button";
import { Figure } from "@/components/ui/Figure";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow, PlateNumber } from "@/components/ui/Ornament";
import { SplitText } from "@/components/ui/SplitText";
import { BRAND_STORY } from "@/lib/site";
import { PHOTOS } from "@/lib/images";

/**
 * The brand story, set on cream like a spread from a printed magazine.
 *
 * The composition is deliberately asymmetric and deliberately overlapped: the
 * tall plate rises above the text column and the square plate breaks its left
 * edge. A tidy two-column grid would read as a template; an overlap reads as
 * art direction, and costs one negative margin.
 */
export function StorySection() {
  return (
    <section className="luxe relative overflow-hidden text-espresso">
      <div className="container-wide section-y">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          {/* --- Copy ------------------------------------------------------- */}
          <div className="lg:col-span-5 lg:pt-8">
            <Reveal>
              <Eyebrow tone="light">{BRAND_STORY.eyebrow}</Eyebrow>
            </Reveal>

            <SplitText
              as="h2"
              lines={["Mysa", "_(mee-sah)_"]}
              className="display mt-7 text-[clamp(2.75rem,6vw,4.75rem)] text-espresso"
              lineClassName="pb-[0.14em] -mb-[0.1em]"
              stagger={0.07}
            />

            <Reveal delay={0.1}>
              <p className="mt-6 max-w-sm font-display text-[1.375rem] font-light italic leading-[1.55] text-mocha">
                {BRAND_STORY.definition}
              </p>
            </Reveal>

            <Reveal delay={0.16} className="mt-10 space-y-6">
              {BRAND_STORY.body.map((paragraph) => (
                <p
                  key={paragraph}
                  className="max-w-md text-[var(--step-0)] leading-[1.9] text-mocha"
                >
                  {paragraph}
                </p>
              ))}
            </Reveal>

            <Reveal delay={0.22} className="mt-11">
              <ButtonLink href="/about" tone="ink" variant="outline">
                Read our story
              </ButtonLink>
            </Reveal>
          </div>

          {/* --- Plates ------------------------------------------------------ */}
          <div className="lg:col-span-7">
            <div className="relative grid grid-cols-5 gap-4 md:gap-6">
              <Reveal className="col-span-3" scale>
                <Figure
                  src={PHOTOS.espressoMachine.src}
                  alt={PHOTOS.espressoMachine.alt}
                  fallback={PHOTOS.espressoMachine.fallback}
                  sizes="(max-width: 1024px) 60vw, 34vw"
                  className="aspect-3/4 shadow-warm"
                  grade={0.08}
                  zoomOnHover
                />
              </Reveal>

              <div className="col-span-2 flex flex-col gap-4 md:gap-6">
                <Reveal delay={0.1} scale>
                  <Figure
                    src={PHOTOS.beans.src}
                    alt={PHOTOS.beans.alt}
                    fallback={PHOTOS.beans.fallback}
                    sizes="(max-width: 1024px) 40vw, 22vw"
                    className="aspect-square shadow-warm-sm"
                    grade={0.08}
                    zoomOnHover
                  />
                </Reveal>
                <Reveal delay={0.18} scale className="flex-1">
                  <Figure
                    src={PHOTOS.interiorSeats.src}
                    alt={PHOTOS.interiorSeats.alt}
                    fallback={PHOTOS.interiorSeats.fallback}
                    sizes="(max-width: 1024px) 40vw, 22vw"
                    className="h-full min-h-52 shadow-warm-sm"
                    grade={0.08}
                    zoomOnHover
                  />
                </Reveal>
              </div>
            </div>

            {/* --- Pull quote --------------------------------------------- */}
            <Reveal delay={0.16} className="relative mt-14 md:mt-16">
              <span
                className="absolute -left-1 -top-10 select-none font-display text-[7rem] leading-none text-gold-ink/15"
                aria-hidden
              >
                &ldquo;
              </span>

              <blockquote className="relative border-l border-gold-ink/25 pl-8">
                <p className="font-display text-[clamp(1.5rem,2.8vw,2.25rem)] font-light leading-[1.4] text-espresso">
                  {BRAND_STORY.pullQuote}
                </p>
                <footer className="mt-6 flex items-center gap-5">
                  <PlateNumber value={1} tone="light" className="hidden sm:flex" />
                  <cite className="font-sans text-[0.6875rem] font-semibold uppercase not-italic tracking-[0.2em] text-mocha">
                    {BRAND_STORY.attribution}
                  </cite>
                </footer>
              </blockquote>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
