"use client";

import { useEffect } from "react";

import { Flourish } from "@/components/ui/Ornament";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[mysa] unhandled page error:", error);
  }, [error]);

  return (
    <section className="lustre relative flex min-h-[80svh] items-center overflow-hidden bg-espresso">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[140px]"
        style={{
          background:
            "radial-gradient(circle, rgba(201,161,91,0.16) 0%, transparent 68%)",
        }}
        aria-hidden
      />

      <div className="container-wide relative py-32">
        <div className="max-w-xl">
          <Flourish className="max-w-[10rem] justify-start" />
          <p className="eyebrow mt-8 text-alert-light">Something went wrong</p>
          <h1 className="display mt-6 text-[clamp(2.25rem,5.5vw,4.25rem)] text-cream">
            We have dropped something.
          </h1>
          <p className="mt-8 text-[var(--step-1)] leading-[1.85] text-latte">
            An error stopped this page loading properly. Try again — and if it keeps
            happening, write to us at hello@mysa.cafe and we will look into it.
          </p>
          {error.digest ? (
            <p className="mt-4 font-sans text-[0.8125rem] text-latte/60">
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            className="group/btn relative isolate mt-12 inline-flex items-center justify-center overflow-hidden bg-gold px-8 py-4 font-sans text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-espresso"
          >
            <span
              className="absolute inset-0 -z-10 origin-bottom scale-y-0 bg-gold-light transition-transform duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/btn:scale-y-100"
              aria-hidden
            />
            <span className="relative">Try again</span>
          </button>
        </div>
      </div>
    </section>
  );
}
