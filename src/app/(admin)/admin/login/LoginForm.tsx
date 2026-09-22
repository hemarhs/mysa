"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";

import { login, type LoginState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 flex w-full items-center justify-center gap-3 bg-ink px-6 py-4 font-sans text-[0.8125rem] font-medium uppercase tracking-[0.16em] text-linen transition-colors duration-400 hover:bg-ink/88 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(login, {});
  const next = useSearchParams().get("next") ?? "";

  return (
    <form action={formAction} className="space-y-7">
      <input type="hidden" name="next" value={next} />

      {state.error ? (
        <p
          role="alert"
          className="border-l-2 border-terracotta bg-terracotta/8 py-3.5 pl-4 pr-3 font-sans text-[0.875rem] leading-relaxed text-terracotta"
        >
          {state.error}
        </p>
      ) : null}

      <div>
        <label htmlFor="email" className="eyebrow block text-ink-muted">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
          className="mt-2 w-full border-b border-ink/20 bg-transparent py-3 font-sans text-[1rem] text-ink transition-colors focus:border-gold-dim focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="password" className="eyebrow block text-ink-muted">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-2 w-full border-b border-ink/20 bg-transparent py-3 font-sans text-[1rem] text-ink transition-colors focus:border-gold-dim focus:outline-none"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
