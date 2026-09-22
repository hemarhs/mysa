"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

import { submitContact, type ContactState } from "@/app/(site)/contact/actions";
import { Flourish } from "@/components/ui/Ornament";
import { cn } from "@/lib/cn";
import { EASE_EXPO } from "@/lib/motion";

const initialState: ContactState = { status: "idle" };

/**
 * Underlined fields rather than boxes: closer to a form on good stationery,
 * and it keeps the dark ground unbroken. The focus state draws a gold rule
 * in from the left rather than swapping a border colour, so a keyboard user
 * sees movement, not just a recolour.
 */
function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group/field">
      <label className="eyebrow block text-latte/80 transition-colors duration-500 group-focus-within/field:text-gold">
        {label}
        {hint ? (
          <span className="ml-2 normal-case tracking-normal opacity-60">{hint}</span>
        ) : null}
      </label>

      <div className="relative">
        {children}
        {/* Resting hairline, plus the gold rule that draws over it. */}
        <span
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 block h-px",
            error ? "bg-alert-light/70" : "bg-hairline"
          )}
          aria-hidden
        />
        <span
          className="pointer-events-none absolute inset-x-0 bottom-0 block h-px origin-left scale-x-0 bg-gold transition-transform duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-focus-within/field:scale-x-100"
          aria-hidden
        />
      </div>

      {error ? (
        <p className="mt-2.5 font-sans text-[0.8125rem] text-alert-light">{error}</p>
      ) : null}
    </div>
  );
}

const fieldClass =
  "w-full bg-transparent px-0 py-4 font-sans text-[1rem] text-cream " +
  "placeholder:text-latte/40 focus:outline-none";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="group/btn relative isolate inline-flex items-center justify-center gap-3 overflow-hidden bg-gold px-8 py-4 font-sans text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-espresso transition-colors duration-500 disabled:cursor-wait disabled:opacity-60"
    >
      <span
        className="absolute inset-0 -z-10 origin-bottom scale-y-0 bg-gold-light transition-transform duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/btn:scale-y-100"
        aria-hidden
      />
      <span className="relative">{pending ? "Sending…" : "Send message"}</span>
      {pending ? (
        <span
          className="relative block h-3.5 w-3.5 animate-spin rounded-full border border-espresso/30 border-t-espresso"
          aria-hidden
        />
      ) : null}
    </button>
  );
}

export function ContactForm() {
  const [state, formAction] = useActionState(submitContact, initialState);

  if (state.status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE_EXPO }}
        className="border border-gold/30 bg-gold/[0.04] p-10 text-center"
        role="status"
      >
        <Flourish className="mb-8" />
        <h3 className="font-display text-[2rem] font-light text-cream">
          Message received.
        </h3>
        <p className="mx-auto mt-5 max-w-sm text-[0.9375rem] leading-[1.85] text-latte">
          {state.message}
        </p>
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
            className="border-l-2 border-alert-light bg-alert-light/[0.07] py-4 pl-5 pr-4 font-sans text-[0.9375rem] leading-relaxed text-alert-light"
          >
            {state.message}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <div className="grid gap-9 sm:grid-cols-2">
        <Field label="Your name" error={state.fieldErrors?.name}>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            aria-invalid={Boolean(state.fieldErrors?.name)}
            aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
            className={fieldClass}
            placeholder="Ines Halvorsen"
          />
        </Field>

        <Field label="Email" error={state.fieldErrors?.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
            className={fieldClass}
            placeholder="you@example.com"
          />
        </Field>
      </div>

      <Field label="Subject" hint="(optional)">
        <input
          id="subject"
          name="subject"
          type="text"
          className={fieldClass}
          placeholder="A private evening downstairs"
        />
      </Field>

      <Field label="Message" error={state.fieldErrors?.message}>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          aria-invalid={Boolean(state.fieldErrors?.message)}
          aria-describedby={state.fieldErrors?.message ? "message-error" : undefined}
          className={cn(fieldClass, "resize-y")}
          placeholder="Tell us what you need and when."
        />
      </Field>

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-wrap items-center gap-6 pt-2">
        <SubmitButton />
        <p className="text-[0.8125rem] leading-relaxed text-latte/80">
          We reply to everything, usually within a day.
        </p>
      </div>
    </form>
  );
}
