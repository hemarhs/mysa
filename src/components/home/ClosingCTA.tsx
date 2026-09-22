import { ButtonLink } from "@/components/ui/Button";
import { ReserveButton } from "@/components/reserve/ReserveButton";
import { Reveal } from "@/components/ui/Reveal";
import { SplitText } from "@/components/ui/SplitText";
import { Flourish } from "@/components/ui/Ornament";
import { SITE } from "@/lib/site";

/**
 * The closing invitation. One pool of lamplight, one line of type set very
 * large, and two ways to act on it. Deliberately the quietest section on the
 * page in terms of elements and the loudest in terms of scale.
 */
export function ClosingCTA() {
  return (
    <section className="lustre relative isolate overflow-hidden border-t border-hairline bg-espresso">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-55 blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, rgba(201,161,91,0.24) 0%, rgba(107,69,49,0.1) 42%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="container-wide relative py-28 md:py-40">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Reveal>
            <Flourish className="mb-10" />
          </Reveal>

          <SplitText
            as="h2"
            lines={["Come and _sit_ with us."]}
            className="display text-[clamp(2.25rem,6.2vw,5rem)] text-cream"
            lineClassName="pb-[0.14em] -mb-[0.1em]"
            stagger={0.07}
          />

          <Reveal delay={0.16}>
            <p className="mt-9 max-w-xl text-[var(--step-1)] leading-[1.9] text-latte">
              Tables of four or fewer are walk-in — just come in. For anything
              larger, or a private evening downstairs, hold a table and we will
              confirm by email.
            </p>
          </Reveal>

          <Reveal delay={0.24} className="mt-12">
            <div className="flex flex-wrap items-center justify-center gap-5">
              <ReserveButton variant="solid">Hold a table</ReserveButton>
              <ButtonLink href="/menu" variant="outline">
                View the menu
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <a
              href={`mailto:${SITE.email}`}
              className="group/mail mt-12 inline-flex flex-col items-center gap-1.5"
            >
              <span className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-latte transition-colors duration-500 group-hover/mail:text-gold">
                {SITE.email}
              </span>
              <span className="block h-px w-full origin-center scale-x-0 bg-gold transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/mail:scale-x-100" />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
