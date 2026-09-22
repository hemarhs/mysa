import Link from "next/link";

import { getHours, getSettings } from "@/lib/db/queries";
import { groupHours } from "@/lib/format";
import { NAV_LINKS, SITE } from "@/lib/site";
import { Wordmark } from "./Wordmark";

export async function Footer() {
  const [settings, hours] = await Promise.all([getSettings(), getHours()]);
  const grouped = groupHours(hours);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-hairline bg-espresso">
      <div className="container-wide py-20 md:py-24">
        <div className="grid gap-14 md:grid-cols-12">
          <div className="md:col-span-5">
            <Wordmark className="text-cream" />
            <p className="mt-7 max-w-sm text-[0.9375rem] leading-[1.8] text-cream-muted">
              {SITE.description}
            </p>
            <a
              href={`mailto:${SITE.email}`}
              className="mt-8 inline-block font-serif text-2xl font-light text-gold transition-colors duration-400 hover:text-gold-light"
            >
              {SITE.email}
            </a>
          </div>

          <div className="md:col-span-3">
            <h3 className="eyebrow text-gold">Find us</h3>
            <address className="mt-6 not-italic text-[0.9375rem] leading-[1.9] text-cream-muted">
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
                className="mt-4 inline-block text-[0.9375rem] text-cream-muted transition-colors duration-400 hover:text-gold"
              >
                {settings.phone}
              </a>
            ) : null}
          </div>

          <div className="md:col-span-2">
            <h3 className="eyebrow text-gold">Hours</h3>
            <dl className="mt-6 space-y-2 text-[0.9375rem] text-cream-muted">
              {grouped.map((group) => (
                <div key={group.label} className="flex justify-between gap-4">
                  <dt className="tabular-nums">{group.label}</dt>
                  <dd className="tabular-nums text-cream/70">{group.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="md:col-span-2">
            <h3 className="eyebrow text-gold">Elsewhere</h3>
            <ul className="mt-6 space-y-3 text-[0.9375rem] text-cream-muted">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors duration-400 hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={SITE.social.instagram}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="transition-colors duration-400 hover:text-gold"
                >
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-hairline pt-8 text-[0.8125rem] text-cream-muted md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {SITE.legalName}. Made on Linden Row.
          </p>
          <p className="text-cream-muted/70">
            Roasted in small lots. Nothing sold more than sixteen days off roast.
          </p>
        </div>
      </div>
    </footer>
  );
}
