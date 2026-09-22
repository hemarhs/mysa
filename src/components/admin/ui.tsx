import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

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
    <div className="flex flex-col gap-5 border-b border-ink/12 pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-[2rem] font-light leading-tight text-ink">{title}</h1>
        {description ? (
          <p className="mt-2.5 max-w-xl text-[0.9375rem] leading-relaxed text-ink-muted">
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
    <div className={cn("border border-ink/12 bg-linen p-6", className)}>{children}</div>
  );
}

export function Label({ className, children, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "block font-sans text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-ink-muted",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}

const fieldBase =
  "mt-2 w-full border border-ink/18 bg-white/60 px-3.5 py-2.5 font-sans text-[0.9375rem] text-ink " +
  "transition-colors duration-300 placeholder:text-ink-muted/50 focus:border-gold-dim focus:outline-none " +
  "disabled:opacity-50";

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
  primary: "bg-ink text-linen hover:bg-ink/88",
  secondary: "border border-ink/20 text-ink hover:border-ink/45 hover:bg-ink/5",
  danger: "border border-terracotta/40 text-terracotta hover:bg-terracotta/8 hover:border-terracotta",
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
        "inline-flex items-center justify-center gap-2 px-5 py-2.5 font-sans text-[0.8125rem] font-medium uppercase tracking-[0.14em] transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50",
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
  tone?: "neutral" | "gold" | "terracotta";
  children: ReactNode;
}) {
  const tones = {
    neutral: "border-ink/20 text-ink-muted",
    gold: "border-gold-dim/45 text-gold-dim",
    terracotta: "border-terracotta/45 text-terracotta",
  };
  return (
    <span
      className={cn(
        "inline-block border px-2.5 py-1 font-sans text-[0.625rem] font-medium uppercase tracking-[0.14em]",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-dashed border-ink/20 px-8 py-16 text-center">
      <p className="font-serif text-[1.375rem] font-light text-ink">{title}</p>
      <p className="mx-auto mt-3 max-w-sm text-[0.9375rem] leading-relaxed text-ink-muted">{body}</p>
    </div>
  );
}
