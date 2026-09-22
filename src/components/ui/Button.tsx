import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

type Variant = "solid" | "outline" | "ghost";
type Tone = "gold" | "ink";

const base =
  "group/btn relative inline-flex items-center justify-center gap-2.5 whitespace-nowrap " +
  "font-sans text-[0.8125rem] font-medium uppercase tracking-[0.16em] " +
  "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] " +
  "disabled:pointer-events-none disabled:opacity-45";

const sizes = "px-7 py-4";

const styles: Record<Tone, Record<Variant, string>> = {
  gold: {
    solid: "bg-gold text-espresso hover:bg-gold-light",
    outline: "border border-gold/40 text-gold hover:border-gold hover:bg-gold/8",
    ghost: "text-gold hover:text-gold-light",
  },
  ink: {
    solid: "bg-ink text-linen hover:bg-ink/88",
    outline: "border border-ink/25 text-ink hover:border-ink/60 hover:bg-ink/5",
    ghost: "text-ink hover:text-ink/70",
  },
};

type ButtonProps = {
  variant?: Variant;
  tone?: Tone;
  children: ReactNode;
  className?: string;
};

export function Button({
  variant = "solid",
  tone = "gold",
  className,
  children,
  ...props
}: ButtonProps & ComponentProps<"button">) {
  return (
    <button className={cn(base, sizes, styles[tone][variant], className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "solid",
  tone = "gold",
  className,
  children,
  ...props
}: ButtonProps & ComponentProps<typeof Link>) {
  return (
    <Link className={cn(base, sizes, styles[tone][variant], className)} {...props}>
      {children}
    </Link>
  );
}

/** Text link with a rule that draws in from the left on hover. */
export function UnderlineLink({
  className,
  children,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        "group/link relative inline-flex flex-col items-start font-sans text-[0.8125rem] font-medium uppercase tracking-[0.16em] text-gold transition-colors duration-300 hover:text-gold-light",
        className
      )}
      {...props}
    >
      {children}
      <span className="mt-1.5 block h-px w-full max-w-0 bg-current transition-[max-width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/link:max-w-full" />
    </Link>
  );
}
