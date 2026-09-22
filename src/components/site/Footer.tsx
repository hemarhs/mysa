import Link from "next/link";

import { getHours, getSettings } from "@/lib/db/queries";
import { groupHours } from "@/lib/format";
import { NAV_LINKS, SITE } from "@/lib/site";
import { Wordmark } from "@/components/brand/Wordmark";
import { Eyebrow } from "@/components/ui/Ornament";
import { FooterSteam } from "./FooterSteam";

export async function Footer() {
  const [settings, hours] = await Promise.all([getSettings(), getHours()]);
  const grouped = groupHours(hours);
  const year = new Date().getFullYear();

  return (
    <footer className="relative isolate overflow-hidden border-t border-hairline bg-espresso">
      {/* Slow steam drifting up behind the type. Client component, lazy, and
          it removes itself entirely on reduced-motion. */}
      <FooterSteam />

      {/* One warm pool of lamplight, low and to the left. */}
      <div
        className="pointer-events-none absolute -bottom-40 left-[8%] h-[34rem] w-[34rem] rounded-full opacity-50 blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, rgba(201,161,91,0.16) 0%, rgba(107,69,49,0.08) 45%, transparent 72%)",
        }}
        aria-hidden
      />

      <div className="container-wide relative z-10 py-20 md:py-28">
        <div className="grid gap-14 md:grid-cols-12 md:gap-10">
          {/* --- Mark and address line -------------------------------------- */}
          <div className="md:col-span-5">
            <Wordmark className="h-6 text-gold md:h-7" />

            <p className="mt-8 max-w-sm text-[0.9375rem] leading-[1.9] text-latte">
              {SITE.description}
            </p>

            <a
              href={`mailto:${SITE.email}`}
              className="group/mail mt-9 inline-flex flex-col gap-1.5"
            >
              <span className="font-display text-[1.75rem] font-light text-cream transition-colors duration-500 group-hover/mail:text-gold">
                {SITE.email}
              </span>
              <span className="block h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/mail:scale-x-100" />
            </a>
          </div>

          {/* --- Find us ---------------------------------------------------- */}
          <div className="md:col-span-3">
            <Eyebrow withRule={false}>Find us</Eyebrow>
            <address className="mt-6 not-italic text-[0.9375rem] leading-[1.95] text-latte">
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
                className="mt-5 inline-block text-[0.9375rem] text-latte transition-colors duration-500 hover:text-gold"
              >
                {settings.phone}
              </a>
            ) : null}
          </div>

          {/* --- Hours ------------------------------------------------------ */}
          <div className="md:col-span-2">
            <Eyebrow withRule={false}>Hours</Eyebrow>
            <dl className="mt-6 space-y-2.5 text-[0.875rem] text-latte">
              {grouped.map((group) => (
                <div key={group.label} className="flex justify-between gap-4">
                  <dt className="tnum">{group.label}</dt>
                  <dd className="tnum text-cream/80">{group.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* --- Elsewhere --------------------------------------------------- */}
          <div className="md:col-span-2">
            <Eyebrow withRule={false}>Elsewhere</Eyebrow>
            <ul className="mt-6 space-y-3.5 text-[0.9375rem] text-latte">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-block transition-colors duration-500 hover:text-gold"
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
                  className="inline-block transition-colors duration-500 hover:text-gold"
                >
                  Instagram ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-hairline pt-8 text-[0.75rem] uppercase tracking-[0.16em] text-latte/60 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {SITE.legalName}
          </p>
          <p className="normal-case tracking-normal text-latte/50">
            Roasted in small lots. Nothing sold more than sixteen days off roast.
          </p>
        </div>
      </div>
    </footer>
  );
}
