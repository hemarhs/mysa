import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { ReserveButton } from "@/components/reserve/ReserveButton";
import { Figure } from "@/components/ui/Figure";
import { Eyebrow } from "@/components/ui/Ornament";
import { SplitText } from "@/components/ui/SplitText";
import { OpenBadge } from "@/components/site/OpenBadge";
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
    <section className="luxe relative overflow-hidden text-espresso">
      <div className="container-wide section-y">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <Eyebrow tone="light">Visit</Eyebrow>
            </Reveal>

            <SplitText
              as="h2"
              lines={["On the _quiet_ end", "of Linden Row."]}
              className="display mt-7 text-[clamp(2.125rem,4.4vw,3.5rem)] text-espresso"
              lineClassName="pb-[0.14em] -mb-[0.1em]"
              stagger={0.055}
            />

            {settings.neighbourhoodNote ? (
              <Reveal delay={0.12}>
                <p className="mt-7 max-w-md text-[var(--step-1)] leading-[1.85] text-mocha">
                  {settings.neighbourhoodNote}
                </p>
              </Reveal>
            ) : null}

            <Reveal delay={0.16} className="mt-12 grid gap-10 sm:grid-cols-2">
              <div>
                <h3 className="eyebrow text-mocha">Address</h3>
                <address className="mt-5 not-italic text-[var(--step-0)] leading-[1.85] text-espresso">
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
                    className="mt-4 inline-block text-[var(--step-0)] text-mocha underline decoration-espresso/20 underline-offset-4 transition-colors duration-500 hover:text-gold-ink"
                  >
                    {settings.phone}
                  </a>
                ) : null}
              </div>

              <div>
                <h3 className="eyebrow flex flex-wrap items-center gap-3 text-mocha">
                  Hours
                  <OpenBadge open={open} tone="light" />
                </h3>
                <dl className="mt-5 space-y-2.5 text-[0.9375rem] text-mocha">
                  {grouped.map((group) => (
                    <div
                      key={group.label}
                      className="flex justify-between gap-6 border-b border-hairline-ink pb-2.5"
                    >
                      <dt className="tnum">{group.label}</dt>
                      <dd className="tnum text-espresso">{group.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>

            <Reveal delay={0.22} className="mt-12 flex flex-wrap gap-5">
              <ReserveButton variant="solid" tone="ink">
                Hold a table
              </ReserveButton>
              <ButtonLink href="/contact" tone="ink" variant="outline">
                Get in touch
              </ButtonLink>
            </Reveal>
          </div>

          <Reveal delay={0.1} className="lg:col-span-7" scale>
            <Figure
              src={PHOTOS.interiorSeats.src}
              alt={PHOTOS.interiorSeats.alt}
              fallback={PHOTOS.interiorSeats.fallback}
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="aspect-4/3 shadow-warm lg:aspect-16/11"
              grade={0.08}
              kenBurns
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
