import { cn } from "@/lib/cn";
import { TextReveal } from "@/components/ui/TextReveal";

type Props = {
  eyebrow: string;
  heading: string;
  standfirst?: string;
  className?: string;
};

/** Shared masthead for the interior pages. Deliberately quiet — no hero image. */
export function PageHeader({ eyebrow, heading, standfirst, className }: Props) {
  return (
    <header className={cn("relative overflow-hidden bg-espresso pt-40 pb-16 md:pt-48 md:pb-20", className)}>
      <div
        className="pointer-events-none absolute -top-40 right-[-10%] h-[36rem] w-[36rem] rounded-full opacity-40 blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, rgba(200,161,101,0.22) 0%, rgba(200,161,101,0.05) 50%, transparent 72%)",
        }}
        aria-hidden
      />

      <div className="container-wide relative">
        <p className="eyebrow flex items-center gap-3 text-gold animate-[fade-up_0.9s_cubic-bezier(0.22,1,0.36,1)_0.05s_both]">
          <span className="rule" aria-hidden />
          {eyebrow}
        </p>

        <TextReveal
          as="h1"
          lines={heading.split("\n")}
          delay={0.15}
          onMount
          className="display mt-7 max-w-4xl text-[clamp(2.75rem,7vw,5.5rem)] text-cream"
          lineClassName="pb-[0.06em]"
        />

        {standfirst ? (
          <p className="mt-8 max-w-xl text-[1.0625rem] leading-[1.8] text-cream-muted animate-[fade-up_1s_cubic-bezier(0.22,1,0.36,1)_0.28s_both]">
            {standfirst}
          </p>
        ) : null}
      </div>
    </header>
  );
}
