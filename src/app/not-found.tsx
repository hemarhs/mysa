import { ButtonLink } from "@/components/ui/Button";
import { Flourish } from "@/components/ui/Ornament";

export default function NotFound() {
  return (
    <section className="lustre relative flex min-h-[86svh] items-center overflow-hidden bg-espresso">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-45 blur-[140px]"
        style={{
          background:
            "radial-gradient(circle, rgba(201,161,91,0.2) 0%, rgba(107,69,49,0.08) 44%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="container-wide relative py-32">
        <div className="max-w-xl">
          <Flourish className="max-w-[10rem] justify-start" />
          <p className="eyebrow mt-8 text-gold tnum">404</p>
          <h1 className="display mt-6 text-[clamp(2.5rem,7vw,5.5rem)] text-cream">
            Nothing on
            <br />
            this table.
          </h1>
          <p className="mt-9 max-w-md text-[var(--step-1)] leading-[1.85] text-latte">
            The page you were after has moved or never existed. The menu, on the
            other hand, is right where we left it.
          </p>
          <div className="mt-12 flex flex-wrap gap-5">
            <ButtonLink href="/">Back to the start</ButtonLink>
            <ButtonLink href="/menu" variant="outline">
              View the menu
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
