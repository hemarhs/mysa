import { ButtonLink } from "@/components/ui/Button";
import { ReserveButton } from "@/components/reserve/ReserveButton";
import { Reveal } from "@/components/ui/Reveal";
import { SITE } from "@/lib/site";

export function ClosingCTA() {
  return (
    <section className="relative overflow-hidden border-t border-hairline bg-espresso py-32 md:py-44">
      {/* A single warm pool of light behind the type, echoing the hero. */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-45 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, rgba(200,161,101,0.28) 0%, rgba(200,161,101,0.06) 45%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="container-wide relative">
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="rule mb-8" aria-hidden />

          <h2 className="display text-[clamp(2.5rem,6vw,4.75rem)] text-cream">
            Come and sit with us.
          </h2>

          <p className="mt-8 max-w-xl text-[1.0625rem] leading-[1.85] text-cream-muted">
            Tables of four or fewer are walk-in — just come in. For anything larger,
            or a private evening downstairs, hold a table and we will confirm by
            email.
          </p>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-5">
            <ReserveButton variant="solid">Hold a table</ReserveButton>
            <ButtonLink href="/menu" variant="outline">
              View the menu
            </ButtonLink>
          </div>

          <a
            href={`mailto:${SITE.email}`}
            className="mt-10 font-sans text-[0.8125rem] uppercase tracking-[0.16em] text-cream-muted transition-colors duration-400 hover:text-gold"
          >
            {SITE.email}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
