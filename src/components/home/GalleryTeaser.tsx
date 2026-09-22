import { Figure } from "@/components/ui/Figure";
import { Reveal } from "@/components/ui/Reveal";
import { UnderlineLink } from "@/components/ui/Button";
import { PHOTOS } from "@/lib/images";

/**
 * Asymmetric four-image grid. The offsets are the point — a neat 2×2 would
 * read as a template; staggered columns read as art direction.
 */
export function GalleryTeaser() {
  return (
    <section className="relative overflow-hidden bg-roast py-28 md:py-40">
      <div className="container-wide">
        <div className="grid gap-6 md:grid-cols-12 md:gap-8">
          <Reveal className="md:col-span-5 md:pt-16">
            <Figure
              src={PHOTOS.interiorWide.src}
              alt={PHOTOS.interiorWide.alt}
              fallback={PHOTOS.interiorWide.fallback}
              sizes="(max-width: 768px) 100vw, 40vw"
              className="aspect-4/5"
              zoomOnHover
            />
          </Reveal>

          <div className="md:col-span-3 flex flex-col gap-6 md:gap-8">
            <Reveal delay={0.08}>
              <Figure
                src={PHOTOS.cheesecake.src}
                alt={PHOTOS.cheesecake.alt}
                fallback={PHOTOS.cheesecake.fallback}
                sizes="(max-width: 768px) 100vw, 25vw"
                className="aspect-square"
                zoomOnHover
              />
            </Reveal>
            <Reveal delay={0.16}>
              <Figure
                src={PHOTOS.latteArt.src}
                alt={PHOTOS.latteArt.alt}
                fallback={PHOTOS.latteArt.fallback}
                sizes="(max-width: 768px) 100vw, 25vw"
                className="aspect-3/4"
                zoomOnHover
              />
            </Reveal>
          </div>

          <div className="md:col-span-4 flex flex-col justify-between gap-10 md:pt-28">
            <Reveal delay={0.12}>
              <Figure
                src={PHOTOS.interiorCorner.src}
                alt={PHOTOS.interiorCorner.alt}
                fallback={PHOTOS.interiorCorner.fallback}
                sizes="(max-width: 768px) 100vw, 33vw"
                className="aspect-4/3"
                zoomOnHover
              />
            </Reveal>

            <Reveal delay={0.2}>
              <h2 className="display text-[clamp(2rem,3.4vw,2.75rem)] text-cream">
                Fourteen seats,
                <br />
                low light,
                <br />
                no hurry.
              </h2>
              <p className="mt-6 max-w-sm text-[0.9375rem] leading-[1.85] text-cream-muted">
                We built the room before we bought the espresso machine. It still
                feels that way — soft chairs, warm lamps, and tables far enough
                apart to hold a conversation.
              </p>
              <div className="mt-8">
                <UnderlineLink href="/gallery">See the room</UnderlineLink>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
