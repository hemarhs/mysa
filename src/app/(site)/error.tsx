"use client";

import { useEffect } from "react";

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
    <section className="flex min-h-[80svh] items-center bg-espresso">
      <div className="container-wide py-32">
        <div className="max-w-xl">
          <span className="rule block" aria-hidden />
          <p className="eyebrow mt-8 text-terracotta-light">Something went wrong</p>
          <h1 className="display mt-6 text-[clamp(2.25rem,5.5vw,4rem)] text-cream">
            We have dropped something.
          </h1>
          <p className="mt-8 text-[1.0625rem] leading-[1.8] text-cream-muted">
            An error stopped this page loading properly. Try again — and if it keeps
            happening, write to us at hello@mysa.cafe and we will look into it.
          </p>
          {error.digest ? (
            <p className="mt-4 font-sans text-[0.8125rem] text-cream-muted/60">
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            className="mt-12 inline-flex items-center bg-gold px-7 py-4 font-sans text-[0.8125rem] font-medium uppercase tracking-[0.16em] text-espresso transition-colors duration-500 hover:bg-gold-light"
          >
            Try again
          </button>
        </div>
      </div>
    </section>
  );
}
