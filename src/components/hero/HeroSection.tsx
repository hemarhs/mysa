import { ButtonLink } from "@/components/ui/Button";
import { ReserveButton } from "@/components/reserve/ReserveButton";
import { SplitText } from "@/components/ui/SplitText";
import { Eyebrow } from "@/components/ui/Ornament";
import { SITE } from "@/lib/site";
import { HeroStage } from "./HeroStage";
import { ScrollCue } from "./ScrollCue";

/**
 * The hero.
 *
 * Composition first, 3D second: the type, the rules and the lamplight make a
 * complete picture on their own, and `HeroStage` layers the coffee cup in
 * behind them only on devices that can carry it. Nothing below depends on
 * WebGL having loaded.
 */
export function HeroSection({ announcement }: { announcement?: string | null }) {
  return (
    <section className="grain relative isolate flex min-h-[100svh] items-center overflow-hidden">
      <HeroStage />

      <div className="container-wide relative z-10 pb-28 pt-36 md:pt-32">
        <div className="max-w-2xl">
          <div className="animate-[fade-up_1s_cubic-bezier(0.16,1,0.3,1)_0.1s_both]">
            <Eyebrow>Specialty coffee &amp; dessert bar</Eyebrow>
          </div>

          <SplitText
            as="h1"
            lines={["Somewhere", "to _slow_ down."]}
            delay={0.28}
            stagger={0.08}
            onMount
            className="display mt-9 text-[clamp(3rem,9.5vw,8rem)] text-cream"
            lineClassName="pb-[0.14em] -mb-[0.08em]"
          />

          <p className="mt-10 max-w-lg text-[var(--step-1)] leading-[1.85] text-latte animate-[fade-up_1.1s_cubic-bezier(0.16,1,0.3,1)_0.72s_both]">
            Single-origin coffee roasted in small lots, desserts made each morning
            in our own kitchen, and a room built for staying longer than you meant
            to.
          </p>

          <div className="mt-12 flex flex-wrap items-center gap-5 animate-[fade-up_1.1s_cubic-bezier(0.16,1,0.3,1)_0.86s_both]">
            <ButtonLink href="/menu">View the menu</ButtonLink>
            <ReserveButton variant="outline">Hold a table</ReserveButton>
          </div>

          {announcement ? (
            <p className="mt-12 max-w-md border-l border-gold/40 pl-5 text-[0.9375rem] leading-[1.8] text-cream/75 animate-[fade-up_1.1s_cubic-bezier(0.16,1,0.3,1)_0.98s_both]">
              {announcement}
            </p>
          ) : null}
        </div>
      </div>

      {/* Editorial margin note — the kind of detail a printed page would carry. */}
      <span
        className="absolute right-8 top-1/2 hidden -translate-y-1/2 font-sans text-[0.625rem] font-semibold uppercase tracking-[0.34em] text-gold/45 xl:block"
        style={{ writingMode: "vertical-rl" }}
        aria-hidden
      >
        27 Linden Row · Est. {SITE.founded}
      </span>

      <ScrollCue />

      <span className="sr-only">
        {SITE.name} — {SITE.description}
      </span>
    </section>
  );
}
