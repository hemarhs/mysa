import { ButtonLink } from "@/components/ui/Button";
import { ReserveButton } from "@/components/reserve/ReserveButton";
import { TextReveal } from "@/components/ui/TextReveal";
import { SITE } from "@/lib/site";
import { Hero3D } from "./Hero3D";
import { ScrollCue } from "./ScrollCue";

export function HeroSection({ announcement }: { announcement?: string | null }) {
  return (
    <section className="grain relative flex min-h-[100svh] items-center overflow-hidden">
      <Hero3D />

      <div className="container-wide relative z-10 pt-32 pb-28">
        <div className="max-w-2xl">
          <p className="eyebrow flex items-center gap-3 text-gold animate-[fade-up_1s_cubic-bezier(0.22,1,0.36,1)_0.1s_both]">
            <span className="rule" aria-hidden />
            Specialty coffee &amp; dessert bar
          </p>

          <TextReveal
            as="h1"
            lines={["Somewhere", "to slow down."]}
            delay={0.22}
            onMount
            className="display mt-8 text-[clamp(3.25rem,9vw,7.5rem)] text-cream"
            lineClassName="pb-[0.06em]"
          />

          <p className="mt-9 max-w-lg text-[1.0625rem] leading-[1.8] text-cream-muted animate-[fade-up_1.1s_cubic-bezier(0.22,1,0.36,1)_0.38s_both]">
            Single-origin coffee roasted in small lots, desserts made each morning in
            our own kitchen, and a room built for staying longer than you meant to.
          </p>

          <div className="mt-12 flex flex-wrap items-center gap-5 animate-[fade-up_1.1s_cubic-bezier(0.22,1,0.36,1)_0.52s_both]">
            <ButtonLink href="/menu">View the menu</ButtonLink>
            <ReserveButton variant="outline">Hold a table</ReserveButton>
          </div>

          {announcement ? (
            <p className="mt-12 border-l border-gold/40 pl-5 text-[0.9375rem] leading-relaxed text-cream/75 animate-[fade-up_1.1s_cubic-bezier(0.22,1,0.36,1)_0.62s_both]">
              {announcement}
            </p>
          ) : null}
        </div>
      </div>

      <ScrollCue />
      <span className="sr-only">
        {SITE.name} — {SITE.description}
      </span>
    </section>
  );
}
