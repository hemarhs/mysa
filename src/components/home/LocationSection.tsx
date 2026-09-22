import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { ReserveButton } from "@/components/reserve/ReserveButton";
import { Figure } from "@/components/ui/Figure";
import { groupHours, isOpenNow } from "@/lib/format";
import { PHOTOS } from "@/lib/images";

type Props = {
  settings: {
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    region?: string | null;
    postalCode?: string | null;
    phone?: string | null;
    mapUrl?: string | null;
    neighbourhoodNote?: string | null;
  };
  hours: { dayOfWeek: number; opensAt: string; closesAt: string; isClosed: boolean }[];
};

export function LocationSection({ settings, hours }: Props) {
  const grouped = groupHours(hours);
  const open = isOpenNow(hours);

  return (
    <section className="bg-linen py-28 text-ink md:py-40">
      <div className="container-wide">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <Reveal>
              <span className="eyebrow flex items-center gap-3 text-gold-dim">
                <span className="h-px w-12 bg-gold-dim/50" aria-hidden />
                Visit
              </span>

              <h2 className="display mt-6 text-[clamp(2.25rem,4.6vw,3.6rem)]">
                On the quiet end
                <br />
                of Linden Row.
              </h2>

              {settings.neighbourhoodNote ? (
                <p className="mt-6 max-w-md text-[1.0625rem] leading-[1.8] text-ink-muted">
                  {settings.neighbourhoodNote}
                </p>
              ) : null}
            </Reveal>

            <Reveal delay={0.1} className="mt-12 grid gap-10 sm:grid-cols-2">
              <div>
                <h3 className="eyebrow text-ink-muted">Address</h3>
                <address className="mt-4 not-italic text-[1.0625rem] leading-[1.8] text-ink">
                  {settings.addressLine1}
                  <br />
                  {settings.addressLine2 ? (
                    <>
                      {settings.addressLine2}
                      <br />
                    </>
                  ) : null}
                  {settings.city}
                  {settings.region ? `, ${settings.region}` : ""} {settings.postalCode}
                </address>
                {settings.phone ? (
                  <a
                    href={`tel:${settings.phone.replace(/[^0-9+]/g, "")}`}
                    className="mt-3 inline-block text-[1.0625rem] text-ink-muted underline decoration-ink/20 underline-offset-4 transition-colors hover:text-ink"
                  >
                    {settings.phone}
                  </a>
                ) : null}
              </div>

              <div>
                <h3 className="eyebrow flex items-center gap-2.5 text-ink-muted">
                  Hours
                  <span
                    className={`inline-flex items-center gap-1.5 normal-case tracking-normal ${
                      open ? "text-gold-dim" : "text-ink-muted/70"
                    }`}
                  >
                    <span
                      className={`block h-1.5 w-1.5 rounded-full ${
                        open ? "bg-gold-dim" : "bg-ink-muted/40"
                      }`}
                      aria-hidden
                    />
                    {open ? "Open now" : "Closed"}
                  </span>
                </h3>
                <dl className="mt-4 space-y-2 text-[1rem] text-ink-muted">
                  {grouped.map((group) => (
                    <div key={group.label} className="flex justify-between gap-6">
                      <dt className="tabular-nums">{group.label}</dt>
                      <dd className="tabular-nums text-ink">{group.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>

            <Reveal delay={0.16} className="mt-12 flex flex-wrap gap-5">
              <ReserveButton
                variant="solid"
                className="bg-ink text-linen hover:bg-ink/85"
              >
                Hold a table
              </ReserveButton>
              <ButtonLink href="/contact" tone="ink" variant="outline">
                Get in touch
              </ButtonLink>

            </Reveal>
          </div>

          <Reveal delay={0.08} className="lg:col-span-7">
            <Figure
              src={PHOTOS.interiorSeats.src}
              alt={PHOTOS.interiorSeats.alt}
              fallback={PHOTOS.interiorSeats.fallback}
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="aspect-4/3 lg:aspect-16/11"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
