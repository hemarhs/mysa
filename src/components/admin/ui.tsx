import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * The admin design system.
 *
 * Same palette, same two typefaces, same gold accent as the shopfront — and
 * almost none of the motion. Someone uses this panel at eight in the morning
 * with one hand on a coffee; a curtain transition and a magnetic button would
 * be an obstacle, not a delight. Every interaction here is a fast colour or
 * border change, nothing longer than 300ms.
 *
 * Historical note: this panel used to be written against alias colour names
 * (`ink`, `linen`, `gold-dim`, `terracotta`). Those aliases still exist in
 * globals.css pointing at the new palette, which is how the admin changed
 * colour before a single file here was touched. They have since been renamed
 * to the canonical tones for clarity.
 */

export function PageTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 border-b border-hairline-ink pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-[clamp(1.75rem,3.5vw,2.25rem)] font-light leading-tight text-espresso">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-mocha">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "border border-hairline-ink bg-cream p-6 transition-colors duration-300",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Label({ className, children, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "block font-sans text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-mocha",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}

const fieldBase = [
  "mt-2 w-full border border-espresso/15 bg-white/55 px-3.5 py-2.5",
  "font-sans text-[0.9375rem] text-espresso",
  "transition-[border-color,box-shadow] duration-300",
  "placeholder:text-mocha/45",
  "focus:border-gold-ink focus:outline-none focus:ring-1 focus:ring-gold-ink/25",
  "disabled:opacity-50",
].join(" ");

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, "resize-y", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(fieldBase, className)} {...props}>
      {children}
    </select>
  );
}

type ButtonTone = "primary" | "secondary" | "danger";

const toneClass: Record<ButtonTone, string> = {
  primary: "bg-espresso text-cream hover:bg-mocha",
  secondary:
    "border border-espresso/20 text-espresso hover:border-gold-ink hover:bg-gold-ink/[0.06]",
  danger: "border border-alert/40 text-alert hover:border-alert hover:bg-alert/[0.08]",
};

export function AdminButton({
  tone = "primary",
  className,
  children,
  ...props
}: ComponentProps<"button"> & { tone?: ButtonTone }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 px-5 py-2.5",
        "font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.18em]",
        "transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50",
        toneClass[tone],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Pill({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "gold" | "alert" | "sage";
  children: ReactNode;
}) {
  const tones = {
    neutral: "border-espresso/20 text-mocha",
    gold: "border-gold-ink/45 text-gold-ink",
    alert: "border-alert/45 text-alert",
    sage: "border-sage/45 text-sage",
  };
  return (
    <span
      className={cn(
        "inline-block border px-2.5 py-1 font-sans text-[0.5625rem] font-semibold uppercase tracking-[0.18em]",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-dashed border-espresso/20 px-8 py-16 text-center">
      <span className="mx-auto mb-5 block h-1.5 w-1.5 rotate-45 bg-gold-ink/50" aria-hidden />
      <p className="font-display text-[1.5rem] font-light text-espresso">{title}</p>
      <p className="mx-auto mt-3 max-w-sm text-[0.9375rem] leading-relaxed text-mocha">
        {body}
      </p>
    </div>
  );
}
