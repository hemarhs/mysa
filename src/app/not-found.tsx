import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="flex min-h-[80svh] items-center bg-espresso">
      <div className="container-wide py-32">
        <div className="max-w-xl">
          <span className="rule block" aria-hidden />
          <p className="eyebrow mt-8 text-gold">404</p>
          <h1 className="display mt-6 text-[clamp(2.75rem,7vw,5rem)] text-cream">
            Nothing on this table.
          </h1>
          <p className="mt-8 text-[1.0625rem] leading-[1.8] text-cream-muted">
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
