"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

import { submitContact, type ContactState } from "@/app/(site)/contact/actions";
import { cn } from "@/lib/cn";

const initialState: ContactState = { status: "idle" };

const fieldClass =
  "w-full border-b bg-transparent px-0 py-4 font-sans text-[1rem] text-cream placeholder:text-cream-muted/50 transition-colors duration-400 focus:outline-none focus:border-gold";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative inline-flex items-center justify-center gap-3 bg-gold px-8 py-4 font-sans text-[0.8125rem] font-medium uppercase tracking-[0.16em] text-espresso transition-all duration-500 hover:bg-gold-light disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Sending…" : "Send message"}
      {pending ? (
        <span
          className="block h-3.5 w-3.5 animate-spin rounded-full border border-espresso/30 border-t-espresso"
          aria-hidden
        />
      ) : null}
    </button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-2 font-sans text-[0.8125rem] text-terracotta-light">{message}</p>;
}

export function ContactForm() {
  const [state, formAction] = useActionState(submitContact, initialState);

  if (state.status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="border border-gold/30 bg-gold/5 p-10"
        role="status"
      >
        <span className="rule block" aria-hidden />
        <h3 className="mt-6 font-serif text-[1.75rem] font-light text-cream">
          Message received.
        </h3>
        <p className="mt-4 text-[0.9375rem] leading-[1.8] text-cream-muted">{state.message}</p>
      </motion.div>
    );
  }

  return (
    <form action={formAction} className="space-y-9" noValidate>
      <AnimatePresence>
        {state.status === "error" && state.message ? (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="border-l-2 border-terracotta bg-terracotta/8 py-4 pl-5 pr-4 font-sans text-[0.9375rem] leading-relaxed text-terracotta-light"
          >
            {state.message}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <div className="grid gap-9 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="eyebrow block text-cream-muted">
            Your name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            aria-invalid={Boolean(state.fieldErrors?.name)}
            aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
            className={cn(fieldClass, state.fieldErrors?.name ? "border-terracotta" : "border-hairline")}
            placeholder="Ines Halvorsen"
          />
          <span id="name-error">
            <FieldError message={state.fieldErrors?.name} />
          </span>
        </div>

        <div>
          <label htmlFor="email" className="eyebrow block text-cream-muted">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
            className={cn(fieldClass, state.fieldErrors?.email ? "border-terracotta" : "border-hairline")}
            placeholder="you@example.com"
          />
          <span id="email-error">
            <FieldError message={state.fieldErrors?.email} />
          </span>
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="eyebrow block text-cream-muted">
          Subject <span className="normal-case tracking-normal opacity-60">(optional)</span>
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          className={cn(fieldClass, "border-hairline")}
          placeholder="A private evening downstairs"
        />
      </div>

      <div>
        <label htmlFor="message" className="eyebrow block text-cream-muted">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          aria-invalid={Boolean(state.fieldErrors?.message)}
          aria-describedby={state.fieldErrors?.message ? "message-error" : undefined}
          className={cn(
            fieldClass,
            "resize-y",
            state.fieldErrors?.message ? "border-terracotta" : "border-hairline"
          )}
          placeholder="Tell us what you need and when."
        />
        <span id="message-error">
          <FieldError message={state.fieldErrors?.message} />
        </span>
      </div>

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-wrap items-center gap-6 pt-2">
        <SubmitButton />
        <p className="text-[0.8125rem] leading-relaxed text-cream-muted/80">
          We reply to everything, usually within a day.
        </p>
      </div>
    </form>
  );
}
