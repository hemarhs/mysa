import { Suspense } from "react";
import Link from "next/link";

import { Wordmark } from "@/components/brand/Wordmark";
import { SITE } from "@/lib/site";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel — dark, so the login still feels like Mysa. */}
      <aside className="lustre relative hidden flex-1 overflow-hidden bg-espresso lg:block">
        <div
          className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[110px]"
          style={{
            background:
              "radial-gradient(circle, rgba(201,161,91,0.26) 0%, rgba(107,69,49,0.1) 46%, transparent 72%)",
          }}
          aria-hidden
        />
        <div className="relative flex h-full flex-col justify-between p-14">
          <Wordmark className="h-5 text-gold" />
          <div>
            <p className="font-display text-[2.75rem] font-light leading-[1.15] text-cream">
              Somewhere
              <br />
              to <em className="display-em text-gold">slow</em> down.
            </p>
            <p className="mt-7 max-w-xs text-[0.9375rem] leading-[1.85] text-latte">
              Menu, gallery, hours and messages — everything the site shows, in one
              place.
            </p>
          </div>
          <p className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.24em] text-latte/60">
            {SITE.legalName}
          </p>
        </div>
      </aside>

      <main className="luxe flex w-full items-center justify-center bg-cream px-6 py-16 lg:w-[30rem] lg:px-14">
        <div className="w-full max-w-sm">
          <Wordmark className="h-4 text-espresso lg:hidden" />

          <h1 className="display mt-10 text-[2.75rem] text-espresso lg:mt-0">Sign in</h1>
          <p className="mt-5 text-[0.9375rem] leading-[1.8] text-mocha">
            Staff access only. If you have lost your password, ask whoever set up
            the site to run <code className="font-mono text-[0.8125rem]">db:create-admin</code> again.
          </p>

          <div className="mt-10">
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>

          <Link
            href="/"
            className="mt-10 inline-block font-sans text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-mocha transition-colors duration-300 hover:text-gold-ink"
          >
            ← Back to the site
          </Link>
        </div>
      </main>
    </div>
  );
}
