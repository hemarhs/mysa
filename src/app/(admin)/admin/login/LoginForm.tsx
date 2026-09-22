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
      className="mt-2 flex w-full items-center justify-center gap-3 bg-espresso px-6 py-4 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-cream transition-colors duration-300 hover:bg-mocha disabled:cursor-wait disabled:opacity-60"
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
          className="border-l-2 border-alert bg-alert/[0.07] py-3.5 pl-4 pr-3 font-sans text-[0.875rem] leading-relaxed text-alert"
        >
          {state.error}
        </p>
      ) : null}

      <div>
        <label htmlFor="email" className="eyebrow block text-mocha">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
          className="mt-2 w-full border-b border-espresso/20 bg-transparent py-3 font-sans text-[1rem] text-espresso transition-colors duration-300 focus:border-gold-ink focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="password" className="eyebrow block text-mocha">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-2 w-full border-b border-espresso/20 bg-transparent py-3 font-sans text-[1rem] text-espresso transition-colors duration-300 focus:border-gold-ink focus:outline-none"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
