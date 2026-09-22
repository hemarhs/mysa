import type { Metadata } from "next";

import { PageHeader } from "@/components/site/PageHeader";
import { ContactForm } from "@/components/contact/ContactForm";
import { MapEmbed } from "@/components/contact/MapEmbed";
import { StructuredData } from "@/components/site/StructuredData";
import { Reveal } from "@/components/ui/Reveal";
import { getHours, getSettings } from "@/lib/db/queries";
import { groupHours, isOpenNow } from "@/lib/format";
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
        heading="Say hello."
        standfirst="No bookings for four or fewer — just come in. For anything larger, a private evening, or press and wholesale, write to us here."
      />

      <section className="bg-espresso pb-24 md:pb-32">
        <div className="container-wide">
          <div className="grid gap-16 lg:grid-cols-12 lg:gap-20">
            {/* --- Details -------------------------------------------------- */}
            <Reveal className="lg:col-span-5">
              <div className="space-y-12">
                <div>
                  <h2 className="eyebrow text-gold">Where</h2>
                  <address className="mt-5 not-italic font-serif text-[1.5rem] font-light leading-[1.5] text-cream">
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
                    <p className="mt-4 max-w-sm text-[0.9375rem] leading-[1.8] text-cream-muted">
                      {settings.neighbourhoodNote}
                    </p>
                  ) : null}
                </div>

                <div>
                  <h2 className="eyebrow flex items-center gap-3 text-gold">
                    When
                    <span
                      className={`inline-flex items-center gap-1.5 normal-case tracking-normal ${
                        open ? "text-gold" : "text-cream-muted"
                      }`}
                    >
                      <span
                        className={`block h-1.5 w-1.5 rounded-full ${
                          open ? "bg-gold" : "bg-cream-muted/40"
                        }`}
                        aria-hidden
                      />
                      {open ? "Open now" : "Closed now"}
                    </span>
                  </h2>

                  <dl className="mt-5 space-y-2.5 text-[1rem]">
                    {grouped.map((group) => (
                      <div key={group.label} className="flex justify-between gap-8 border-b border-hairline pb-2.5">
                        <dt className="tabular-nums text-cream-muted">{group.label}</dt>
                        <dd className="tabular-nums text-cream">{group.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div>
                  <h2 className="eyebrow text-gold">Reach us</h2>
                  <ul className="mt-5 space-y-3 text-[1.0625rem]">
                    <li>
                      <a
                        href={`mailto:${settings.email}`}
                        className="text-cream transition-colors duration-400 hover:text-gold"
                      >
                        {settings.email}
                      </a>
                    </li>
                    {settings.phone ? (
                      <li>
                        <a
                          href={`tel:${settings.phone.replace(/[^0-9+]/g, "")}`}
                          className="text-cream transition-colors duration-400 hover:text-gold"
                        >
                          {settings.phone}
                        </a>
                      </li>
                    ) : null}
                    <li>
                      <a
                        href={SITE.social.instagram}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-cream transition-colors duration-400 hover:text-gold"
                      >
                        Instagram
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </Reveal>

            {/* --- Form ------------------------------------------------------ */}
            <Reveal delay={0.1} className="lg:col-span-7">
              <div className="border border-hairline bg-roast/60 p-8 md:p-12">
                <h2 className="display text-[clamp(1.75rem,3vw,2.5rem)] text-cream">
                  Write to us
                </h2>
                <p className="mt-4 max-w-md text-[0.9375rem] leading-[1.8] text-cream-muted">
                  Large tables, private hire, press, wholesale beans, or a note about
                  something you had here — all welcome.
                </p>

                <div className="mt-10">
                  <ContactForm />
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
