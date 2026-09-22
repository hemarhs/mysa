import { Figure } from "@/components/ui/Figure";
import { Reveal } from "@/components/ui/Reveal";
import { UnderlineLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Ornament";
import { SplitText } from "@/components/ui/SplitText";
import { PHOTOS } from "@/lib/images";

/**
 * Asymmetric four-plate spread on the roast surface.
 *
 * The staggered top offsets are the whole point — a neat 2×2 reads as a
 * template, staggered columns read as a spread someone laid out. The type
 * block sits in the fourth column so the eye travels diagonally down the
 * page rather than straight across it.
 */
export function GalleryTeaser() {
  return (
    <section className="lustre relative isolate overflow-hidden bg-roast">
      <div className="container-wide section-y">
        <div className="grid gap-5 md:grid-cols-12 md:gap-7">
          <Reveal className="md:col-span-5 md:pt-20" scale>
            <Figure
              src={PHOTOS.interiorWide.src}
              alt={PHOTOS.interiorWide.alt}
              fallback={PHOTOS.interiorWide.fallback}
              sizes="(max-width: 768px) 100vw, 40vw"
              className="aspect-4/5 shadow-warm"
              zoomOnHover
              framed
            />
          </Reveal>

          <div className="flex flex-col gap-5 md:col-span-3 md:gap-7">
            <Reveal delay={0.1} scale>
              <Figure
                src={PHOTOS.cheesecake.src}
                alt={PHOTOS.cheesecake.alt}
                fallback={PHOTOS.cheesecake.fallback}
                sizes="(max-width: 768px) 100vw, 25vw"
                className="aspect-square shadow-warm-sm"
                zoomOnHover
              />
            </Reveal>
            <Reveal delay={0.18} scale>
              <Figure
                src={PHOTOS.latteArt.src}
                alt={PHOTOS.latteArt.alt}
                fallback={PHOTOS.latteArt.fallback}
                sizes="(max-width: 768px) 100vw, 25vw"
                className="aspect-3/4 shadow-warm-sm"
                zoomOnHover
              />
            </Reveal>
          </div>

          <div className="flex flex-col justify-between gap-12 md:col-span-4 md:pt-36">
            <Reveal delay={0.14} scale>
              <Figure
                src={PHOTOS.interiorCorner.src}
                alt={PHOTOS.interiorCorner.alt}
                fallback={PHOTOS.interiorCorner.fallback}
                sizes="(max-width: 768px) 100vw, 33vw"
                className="aspect-4/3 shadow-warm-sm"
                zoomOnHover
              />
            </Reveal>

            <div>
              <Reveal delay={0.2}>
                <Eyebrow>The room</Eyebrow>
              </Reveal>

              <SplitText
                as="h2"
                lines={["Fourteen seats,", "low light,", "_no hurry._"]}
                className="display mt-6 text-[clamp(1.875rem,3.4vw,2.75rem)] text-cream"
                lineClassName="pb-[0.14em] -mb-[0.1em]"
                stagger={0.06}
              />

              <Reveal delay={0.26}>
                <p className="mt-7 max-w-sm text-[0.9375rem] leading-[1.9] text-latte">
                  We built the room before we bought the espresso machine. It still
                  feels that way — soft chairs, warm lamps, and tables far enough
                  apart to hold a conversation.
                </p>
                <div className="mt-9">
                  <UnderlineLink href="/gallery">See the room</UnderlineLink>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
