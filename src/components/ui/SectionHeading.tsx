import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";
import { TextReveal } from "./TextReveal";

type Props = {
  eyebrow?: string;
  heading: string;
  standfirst?: string;
  tone?: "dark" | "linen";
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  heading,
  standfirst,
  tone = "dark",
  align = "left",
  className,
}: Props) {
  const muted = tone === "dark" ? "text-cream-muted" : "text-ink-muted";
  const strong = tone === "dark" ? "text-cream" : "text-ink";

  return (
    <Reveal
      className={cn(
        "flex flex-col",
        align === "center" ? "items-center text-center" : "items-start",
        className
      )}
    >
      {eyebrow ? (
        <span className={cn("eyebrow mb-5 flex items-center gap-3", "text-gold")}>
          <span className="rule" aria-hidden />
          {eyebrow}
        </span>
      ) : null}

      <TextReveal
        as="h2"
        lines={heading.split("\n")}
        className={cn("display text-[clamp(2.25rem,4.6vw,3.6rem)]", strong)}
        lineClassName="pb-[0.06em]"
      />

      {standfirst ? (
        <p className={cn("mt-6 max-w-xl text-[1.0625rem] leading-[1.75]", muted)}>{standfirst}</p>
      ) : null}
    </Reveal>
  );
}
