import { ButtonLink } from "@/components/ui/Button";
import { Figure } from "@/components/ui/Figure";
import { Reveal } from "@/components/ui/Reveal";
import { BRAND_STORY } from "@/lib/site";
import { PHOTOS } from "@/lib/images";

export function StorySection() {
  return (
    <section className="bg-linen py-28 text-ink md:py-40">
      <div className="container-wide">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <Reveal>
              <span className="eyebrow flex items-center gap-3 text-gold-dim">
                <span className="h-px w-12 bg-gold-dim/50" aria-hidden />
                {BRAND_STORY.eyebrow}
              </span>

              <h2 className="display mt-6 text-[clamp(2.5rem,5.5vw,4.25rem)]">
                {BRAND_STORY.heading}
              </h2>

              <p className="mt-5 max-w-sm font-serif text-xl font-light italic leading-[1.5] text-ink-muted">
                {BRAND_STORY.definition}
              </p>
            </Reveal>

            <Reveal delay={0.1} className="mt-10 space-y-6">
              {BRAND_STORY.body.map((paragraph) => (
                <p key={paragraph} className="text-[1.0625rem] leading-[1.85] text-ink-muted">
                  {paragraph}
                </p>
              ))}
            </Reveal>

            <Reveal delay={0.16} className="mt-10">
              <ButtonLink href="/about" tone="ink" variant="outline">
                Read our story
              </ButtonLink>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Reveal delay={0.08} className="grid grid-cols-5 gap-5">
              <Figure
                src={PHOTOS.espressoMachine.src}
                alt={PHOTOS.espressoMachine.alt}
                fallback={PHOTOS.espressoMachine.fallback}
                sizes="(max-width: 1024px) 60vw, 34vw"
                className="col-span-3 aspect-3/4"
              />
              <div className="col-span-2 flex flex-col gap-5">
                <Figure
                  src={PHOTOS.beans.src}
                  alt={PHOTOS.beans.alt}
                  fallback={PHOTOS.beans.fallback}
                  sizes="(max-width: 1024px) 40vw, 22vw"
                  className="aspect-square"
                />
                <Figure
                  src={PHOTOS.interiorSeats.src}
                  alt={PHOTOS.interiorSeats.alt}
                  fallback={PHOTOS.interiorSeats.fallback}
                  sizes="(max-width: 1024px) 40vw, 22vw"
                  className="flex-1 min-h-52"
                />
              </div>
            </Reveal>

            <Reveal delay={0.16} className="mt-14 border-l border-ink/15 pl-8">
              <blockquote className="font-serif text-[clamp(1.5rem,2.6vw,2.125rem)] font-light leading-[1.35] text-ink">
                “{BRAND_STORY.pullQuote}”
              </blockquote>
              <cite className="mt-5 block font-sans text-[0.8125rem] uppercase not-italic tracking-[0.16em] text-ink-muted">
                {BRAND_STORY.attribution}
              </cite>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
