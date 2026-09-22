import { Suspense } from "react";
import Link from "next/link";

import { Wordmark } from "@/components/site/Wordmark";
import { SITE } from "@/lib/site";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel — dark, so the login still feels like Mysa. */}
      <aside className="relative hidden flex-1 overflow-hidden bg-espresso lg:block">
        <div
          className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[110px]"
          style={{
            background:
              "radial-gradient(circle, rgba(200,161,101,0.3) 0%, rgba(200,161,101,0.05) 48%, transparent 70%)",
          }}
          aria-hidden
        />
        <div className="relative flex h-full flex-col justify-between p-14">
          <Wordmark className="text-cream" />
          <div>
            <p className="font-serif text-[2.25rem] font-light leading-[1.25] text-cream">
              Somewhere
              <br />
              to slow down.
            </p>
            <p className="mt-6 max-w-xs text-[0.9375rem] leading-[1.8] text-cream-muted">
              Menu, gallery, hours and messages — everything the site shows, in one
              place.
            </p>
          </div>
          <p className="font-sans text-[0.75rem] uppercase tracking-[0.16em] text-cream-muted/60">
            {SITE.legalName}
          </p>
        </div>
      </aside>

      <main className="flex w-full items-center justify-center px-6 py-16 lg:w-[30rem] lg:px-14">
        <div className="w-full max-w-sm">
          <Wordmark className="text-ink lg:hidden" />

          <h1 className="display mt-10 text-[2.5rem] lg:mt-0">Sign in</h1>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-muted">
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
            className="mt-10 inline-block font-sans text-[0.8125rem] uppercase tracking-[0.16em] text-ink-muted transition-colors hover:text-ink"
          >
            ← Back to the site
          </Link>
        </div>
      </main>
    </div>
  );
}
