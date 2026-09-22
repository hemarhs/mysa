import type { Metadata } from "next";

import { PageHeader } from "@/components/site/PageHeader";
import { ContactForm } from "@/components/contact/ContactForm";
import { MapEmbed } from "@/components/contact/MapEmbed";
import { StructuredData } from "@/components/site/StructuredData";
import { OpenBadge } from "@/components/site/OpenBadge";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/Ornament";
import { getHours, getSettings } from "@/lib/db/queries";
import { groupHours, isOpenNow } from "@/lib/format";
import { PHOTOS } from "@/lib/images";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Find Mysa on Linden Row in Hayes Valley. Opening hours, directions, and a note to hello@mysa.cafe.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const [settings, hours] = await Promise.all([getSettings(), getHours()]);
  const grouped = groupHours(hours);
  const open = isOpenNow(hours);

  return (
    <>
      <StructuredData settings={settings} hours={hours} />

      <PageHeader
        eyebrow="Contact"
        heading={"Say _hello._"}
        standfirst="No bookings for four or fewer — just come in. For anything larger, a private evening, or press and wholesale, write to us here."
        plate={PHOTOS.interiorCorner}
        margin="27 Linden Row"
      />

      <section className="lustre relative bg-espresso pb-24 md:pb-32">
        <div className="container-wide">
          <div className="grid gap-16 lg:grid-cols-12 lg:gap-20">
            {/* --- Details -------------------------------------------------- */}
            <div className="lg:col-span-5">
              <div className="space-y-12">
                <Reveal>
                  <Eyebrow>Where</Eyebrow>
                  <address className="mt-6 font-display text-[1.625rem] font-light not-italic leading-[1.5] text-cream">
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
                  {settings.neighbourhoodNote ? (
                    <p className="mt-5 max-w-sm text-[0.9375rem] leading-[1.85] text-latte">
                      {settings.neighbourhoodNote}
                    </p>
                  ) : null}
                </Reveal>

                <Reveal delay={0.08}>
                  <h2 className="eyebrow flex flex-wrap items-center gap-3.5 text-gold">
                    <span className="block h-px w-10 shrink-0 bg-gold/55" aria-hidden />
                    When
                    <OpenBadge open={open} />
                  </h2>

                  <dl className="mt-6 space-y-3 text-[0.9375rem]">
                    {grouped.map((group) => (
                      <div
                        key={group.label}
                        className="flex justify-between gap-8 border-b border-hairline pb-3"
                      >
                        <dt className="tnum text-latte">{group.label}</dt>
                        <dd className="tnum text-cream">{group.value}</dd>
                      </div>
                    ))}
                  </dl>
                </Reveal>

                <Reveal delay={0.14}>
                  <Eyebrow>Reach us</Eyebrow>
                  <ul className="mt-6 space-y-4 text-[var(--step-1)]">
                    <li>
                      <a
                        href={`mailto:${settings.email}`}
                        className="group/l inline-flex flex-col gap-1"
                      >
                        <span className="text-cream transition-colors duration-500 group-hover/l:text-gold">
                          {settings.email}
                        </span>
                        <span className="block h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/l:scale-x-100" />
                      </a>
                    </li>
                    {settings.phone ? (
                      <li>
                        <a
                          href={`tel:${settings.phone.replace(/[^0-9+]/g, "")}`}
                          className="group/l inline-flex flex-col gap-1"
                        >
                          <span className="text-cream transition-colors duration-500 group-hover/l:text-gold">
                            {settings.phone}
                          </span>
                          <span className="block h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/l:scale-x-100" />
                        </a>
                      </li>
                    ) : null}
                    <li>
                      <a
                        href={SITE.social.instagram}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="group/l inline-flex flex-col gap-1"
                      >
                        <span className="text-cream transition-colors duration-500 group-hover/l:text-gold">
                          Instagram ↗
                        </span>
                        <span className="block h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/l:scale-x-100" />
                      </a>
                    </li>
                  </ul>
                </Reveal>
              </div>
            </div>

            {/* --- Form ------------------------------------------------------ */}
            <Reveal delay={0.12} className="lg:col-span-7">
              <div className="panel gilt relative p-8 md:p-12">
                <span
                  className="pointer-events-none absolute inset-4 border border-gold/10"
                  aria-hidden
                />
                <div className="relative">
                  <h2 className="display text-[clamp(1.75rem,3vw,2.5rem)] text-cream">
                    Write to us
                  </h2>
                  <p className="mt-5 max-w-md text-[0.9375rem] leading-[1.85] text-latte">
                    Large tables, private hire, press, wholesale beans, or a note
                    about something you had here — all welcome.
                  </p>

                  <div className="mt-10">
                    <ContactForm />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <MapEmbed
        latitude={settings.latitude}
        longitude={settings.longitude}
        mapUrl={settings.mapUrl}
        label={`${SITE.name}, ${settings.addressLine1}`}
      />
    </>
  );
}
