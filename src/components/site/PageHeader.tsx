import { cn } from "@/lib/cn";
import { SplitText } from "@/components/ui/SplitText";
import { Eyebrow } from "@/components/ui/Ornament";
import { Figure } from "@/components/ui/Figure";
import type { Photo } from "@/lib/images";

type Props = {
  eyebrow: string;
  /** Newlines become visual lines; _underscored_ words are set in italic gold. */
  heading: string;
  standfirst?: string;
  className?: string;
  /** Optional plate set to the right of the type on wide screens. */
  plate?: Photo;
  /** A short label set vertically down the left margin. */
  margin?: string;
};

/**
 * Shared masthead for the interior pages.
 *
 * An asymmetric two-column composition: type in the left seven columns, a
 * tall plate in the right four, and a column of air between them. On narrow
 * screens the plate drops below the type rather than shrinking into a
 * postage stamp.
 */
export function PageHeader({
  eyebrow,
  heading,
  standfirst,
  className,
  plate,
  margin,
}: Props) {
  return (
    <header
      className={cn(
        "lustre relative isolate overflow-hidden bg-espresso pb-16 pt-36 md:pb-24 md:pt-48",
        className
      )}
    >
      {/* Lamplight, high and to the right. */}
      <div
        className="pointer-events-none absolute -top-48 right-[-12%] h-[42rem] w-[42rem] rounded-full opacity-60 blur-[140px]"
        style={{
          background:
            "radial-gradient(circle, rgba(201,161,91,0.2) 0%, rgba(107,69,49,0.1) 46%, transparent 72%)",
        }}
        aria-hidden
      />

      <div className="container-wide relative z-10">
        <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-16">
          <div className={cn(plate ? "lg:col-span-7" : "lg:col-span-9")}>
            <div className="animate-[fade-up_0.9s_cubic-bezier(0.16,1,0.3,1)_0.05s_both]">
              <Eyebrow>{eyebrow}</Eyebrow>
            </div>

            <SplitText
              as="h1"
              lines={heading.split("\n")}
              delay={0.18}
              onMount
              className="display mt-8 text-[clamp(2.5rem,7.5vw,6rem)] text-cream"
              lineClassName="pb-[0.14em] -mb-[0.1em]"
            />

            {standfirst ? (
              <p className="mt-9 max-w-xl text-[var(--step-1)] leading-[1.85] text-latte animate-[fade-up_1s_cubic-bezier(0.16,1,0.3,1)_0.42s_both]">
                {standfirst}
              </p>
            ) : null}
          </div>

          {plate ? (
            <div className="relative lg:col-span-5">
              {margin ? (
                <span
                  className="absolute -left-12 top-0 hidden font-sans text-[0.625rem] font-semibold uppercase tracking-[0.3em] text-gold/50 xl:block"
                  style={{ writingMode: "vertical-rl" }}
                  aria-hidden
                >
                  {margin}
                </span>
              ) : null}
              <Figure
                src={plate.src}
                alt={plate.alt}
                fallback={plate.fallback}
                sizes="(max-width: 1024px) 100vw, 38vw"
                className="aspect-4/5 lg:aspect-3/4"
                // Above the fold on every interior page — this is the LCP
                // candidate, so it is fetched at high priority, not lazily.
                priority
                reveal={false}
                revealDelay={0.35}
                kenBurns
                framed
                grade={0.14}
              />
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
