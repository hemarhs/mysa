import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";
import { SplitText } from "./SplitText";
import { Eyebrow } from "./Ornament";

type Props = {
  eyebrow?: string;
  /** Newlines become visual lines. Wrap a word in _underscores_ to italicise. */
  heading: string;
  standfirst?: string;
  tone?: "dark" | "light";
  align?: "left" | "center";
  className?: string;
  /** Adds the travelling brass sheen. Reserved for one heading per page. */
  shimmer?: boolean;
};

export function SectionHeading({
  eyebrow,
  heading,
  standfirst,
  tone = "dark",
  align = "left",
  className,
  shimmer = false,
}: Props) {
  const muted = tone === "dark" ? "text-latte" : "text-mocha";
  const strong = tone === "dark" ? "text-cream" : "text-espresso";

  return (
    <div
      className={cn(
        "flex flex-col",
        align === "center" ? "items-center text-center" : "items-start",
        className
      )}
    >
      {eyebrow ? (
        <Reveal>
          <Eyebrow tone={tone} className="mb-7">
            {eyebrow}
          </Eyebrow>
        </Reveal>
      ) : null}

      <SplitText
        as="h2"
        lines={heading.split("\n")}
        className={cn(
          "display text-[clamp(2rem,4.6vw,3.75rem)]",
          shimmer ? "brass-shimmer" : strong
        )}
        lineClassName="pb-[0.14em] -mb-[0.1em]"
      />

      {standfirst ? (
        <Reveal delay={0.12}>
          <p
            className={cn(
              "mt-7 max-w-xl text-[var(--step-1)] leading-[1.85]",
              align === "center" && "mx-auto",
              muted
            )}
          >
            {standfirst}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}
