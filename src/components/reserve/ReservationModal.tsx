"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useActionState, useEffect, useMemo, useRef } from "react";
import { useFormStatus } from "react-dom";

import { submitReservation, type ReservationState } from "@/app/reserve-actions";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";

const initial: ReservationState = { status: "idle" };

const field =
  "w-full border-b bg-transparent px-0 py-3.5 font-sans text-[0.9375rem] text-cream " +
  "placeholder:text-cream-muted/45 transition-colors duration-400 focus:outline-none focus:border-gold " +
  "[color-scheme:dark]";

/** Half-hour slots across the widest opening window we run. */
function slots() {
  const out: string[] = [];
  for (let h = 8; h <= 20; h += 1) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 20) out.push(`${String(h).padStart(2, "0")}:30`);
  }
  return out;
}

function pretty(time: string) {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative w-full shrink-0 overflow-hidden whitespace-nowrap bg-gold px-9 py-4 font-sans text-[0.8125rem] font-medium uppercase tracking-[0.16em] text-espresso transition-colors duration-500 hover:bg-gold-light disabled:cursor-wait disabled:opacity-60 sm:w-auto"
    >
      <span className="relative flex items-center justify-center gap-3">
        {pending ? "Sending…" : "Request this table"}
        {pending ? (
          <span className="block h-3.5 w-3.5 animate-spin rounded-full border border-espresso/30 border-t-espresso" aria-hidden />
        ) : null}
      </span>
    </button>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 font-sans text-[0.8125rem] text-terracotta-light">
      {message}
    </p>
  );
}

export function ReservationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, formAction] = useActionState(submitReservation, initial);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  const { today, horizon } = useMemo(() => {
    const now = new Date();
    const later = new Date(now);
    later.setDate(later.getDate() + 60);
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    return { today: iso(now), horizon: iso(later) };
  }, []);

  useEffect(() => {
    if (!open) return;

    restoreFocus.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => closeRef.current?.focus(), 120);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      // Keep focus inside the dialog.
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
      document.body.style.overflow = "";
      restoreFocus.current?.focus();
    };
  }, [open, onClose]);

  const succeeded = state.status === "success";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-espresso/94 p-4 backdrop-blur-md sm:items-center sm:p-8"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reserve-title"
        >
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 28, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.99 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="relative my-auto w-full max-w-2xl border border-gold/25 bg-roast-soft shadow-[0_40px_120px_-20px_rgba(0,0,0,0.95)]"
          >
            {/* Gold hairline across the top edge */}
            <span
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent"
              aria-hidden
            />

            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center text-cream-muted transition-colors duration-300 hover:text-gold"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
                <path d="M5 5l14 14M19 5L5 19" />
              </svg>
            </button>

            <div className="px-7 py-10 sm:px-12 sm:py-12">
              {succeeded ? (
                <div className="text-center">
                  <span className="mx-auto block h-px w-12 bg-gold/60" aria-hidden />
                  <h2 id="reserve-title" className="display mt-8 text-[clamp(2rem,4vw,2.75rem)] text-cream">
                    Table requested.
                  </h2>

                  {state.booking ? (
                    <dl className="mx-auto mt-9 grid max-w-sm grid-cols-2 gap-x-8 gap-y-4 border-y border-hairline py-7 text-left">
                      <div>
                        <dt className="eyebrow text-cream-muted">Name</dt>
                        <dd className="mt-1.5 text-[0.9375rem] text-cream">{state.booking.name}</dd>
                      </div>
                      <div>
                        <dt className="eyebrow text-cream-muted">Party</dt>
                        <dd className="mt-1.5 text-[0.9375rem] text-cream">
                          {state.booking.partySize} {state.booking.partySize === 1 ? "person" : "people"}
                        </dd>
                      </div>
                      <div>
                        <dt className="eyebrow text-cream-muted">Date</dt>
                        <dd className="mt-1.5 text-[0.9375rem] text-cream">
                          {new Date(`${state.booking.date}T00:00:00`).toLocaleDateString("en-GB", {
                            weekday: "short",
                            day: "numeric",
                            month: "long",
                          })}
                        </dd>
                      </div>
                      <div>
                        <dt className="eyebrow text-cream-muted">Time</dt>
                        <dd className="mt-1.5 text-[0.9375rem] text-cream">{pretty(state.booking.time)}</dd>
                      </div>
                    </dl>
                  ) : null}

                  <p className="mx-auto mt-8 max-w-sm text-[0.9375rem] leading-[1.8] text-cream-muted">
                    {state.message}
                  </p>

                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-10 border border-gold/40 px-7 py-3.5 font-sans text-[0.8125rem] font-medium uppercase tracking-[0.16em] text-gold transition-all duration-500 hover:border-gold hover:bg-gold hover:text-espresso"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <p className="eyebrow flex items-center gap-3 text-gold">
                    <span className="h-px w-10 bg-gold/50" aria-hidden />
                    Reservations
                  </p>

                  <h2 id="reserve-title" className="display mt-6 text-[clamp(2rem,4vw,2.75rem)] text-cream">
                    Hold a table.
                  </h2>

                  <p className="mt-5 max-w-md text-[0.9375rem] leading-[1.8] text-cream-muted">
                    Tables of four or fewer are walk-in — just come in. Use this for
                    larger groups, or when you would rather be certain.
                  </p>

                  <form action={formAction} className="mt-10 space-y-7" noValidate>
                    <AnimatePresence>
                      {state.status === "error" && state.message ? (
                        <motion.p
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          role="alert"
                          className="border-l-2 border-terracotta bg-terracotta/10 py-3.5 pl-5 pr-4 font-sans text-[0.875rem] leading-relaxed text-terracotta-light"
                        >
                          {state.message}
                        </motion.p>
                      ) : null}
                    </AnimatePresence>

                    <div className="grid gap-7 sm:grid-cols-2">
                      <div>
                        <label htmlFor="r-name" className="eyebrow block text-cream-muted">
                          Name
                        </label>
                        <input
                          id="r-name"
                          name="name"
                          autoComplete="name"
                          required
                          aria-invalid={Boolean(state.fieldErrors?.name)}
                          aria-describedby={state.fieldErrors?.name ? "r-name-error" : undefined}
                          className={cn(field, state.fieldErrors?.name ? "border-terracotta" : "border-hairline")}
                          placeholder="Ines Halvorsen"
                        />
                        <FieldError id="r-name-error" message={state.fieldErrors?.name} />
                      </div>

                      <div>
                        <label htmlFor="r-email" className="eyebrow block text-cream-muted">
                          Email
                        </label>
                        <input
                          id="r-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          aria-invalid={Boolean(state.fieldErrors?.email)}
                          aria-describedby={state.fieldErrors?.email ? "r-email-error" : undefined}
                          className={cn(field, state.fieldErrors?.email ? "border-terracotta" : "border-hairline")}
                          placeholder="you@example.com"
                        />
                        <FieldError id="r-email-error" message={state.fieldErrors?.email} />
                      </div>

                      <div>
                        <label htmlFor="r-phone" className="eyebrow block text-cream-muted">
                          Phone <span className="normal-case tracking-normal opacity-60">(optional)</span>
                        </label>
                        <input
                          id="r-phone"
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          className={cn(field, "border-hairline")}
                          placeholder="+1 415 555 0142"
                        />
                      </div>

                      <div>
                        <label htmlFor="r-party" className="eyebrow block text-cream-muted">
                          Party size
                        </label>
                        <select
                          id="r-party"
                          name="partySize"
                          defaultValue="2"
                          required
                          className={cn(field, state.fieldErrors?.partySize ? "border-terracotta" : "border-hairline")}
                        >
                          {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n} className="bg-roast text-cream">
                              {n} {n === 1 ? "person" : "people"}
                            </option>
                          ))}
                        </select>
                        <FieldError id="r-party-error" message={state.fieldErrors?.partySize} />
                      </div>

                      <div>
                        <label htmlFor="r-date" className="eyebrow block text-cream-muted">
                          Date
                        </label>
                        <input
                          id="r-date"
                          name="date"
                          type="date"
                          required
                          min={today}
                          max={horizon}
                          defaultValue={today}
                          aria-invalid={Boolean(state.fieldErrors?.date)}
                          aria-describedby={state.fieldErrors?.date ? "r-date-error" : undefined}
                          className={cn(field, state.fieldErrors?.date ? "border-terracotta" : "border-hairline")}
                        />
                        <FieldError id="r-date-error" message={state.fieldErrors?.date} />
                      </div>

                      <div>
                        <label htmlFor="r-time" className="eyebrow block text-cream-muted">
                          Time
                        </label>
                        <select
                          id="r-time"
                          name="time"
                          defaultValue="18:00"
                          required
                          className={cn(field, state.fieldErrors?.time ? "border-terracotta" : "border-hairline")}
                        >
                          {slots().map((slot) => (
                            <option key={slot} value={slot} className="bg-roast text-cream">
                              {pretty(slot)}
                            </option>
                          ))}
                        </select>
                        <FieldError id="r-time-error" message={state.fieldErrors?.time} />
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="r-occasion" className="eyebrow block text-cream-muted">
                          Occasion <span className="normal-case tracking-normal opacity-60">(optional)</span>
                        </label>
                        <select id="r-occasion" name="occasion" defaultValue="" className={cn(field, "border-hairline")}>
                          <option value="" className="bg-roast text-cream">No occasion</option>
                          {["Birthday", "Anniversary", "Work meeting", "Private hire", "Cupping / tasting", "Something else"].map((o) => (
                            <option key={o} value={o} className="bg-roast text-cream">
                              {o}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="r-notes" className="eyebrow block text-cream-muted">
                          Anything we should know
                        </label>
                        <textarea
                          id="r-notes"
                          name="notes"
                          rows={3}
                          className={cn(field, "resize-y border-hairline")}
                          placeholder="Allergies, a pram, a quiet corner…"
                        />
                      </div>
                    </div>

                    {/* Honeypot */}
                    <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                      <label htmlFor="r-company">Company</label>
                      <input id="r-company" name="company" tabIndex={-1} autoComplete="off" />
                    </div>

                    <div className="flex flex-col gap-5 border-t border-hairline pt-7 sm:flex-row sm:items-center">
                      <SubmitButton />
                      <p className="text-[0.8125rem] leading-relaxed text-cream-muted/85">
                        Nothing is charged. We confirm by email — usually within a few
                        hours, or write to{" "}
                        <a href={`mailto:${SITE.email}`} className="text-gold transition-colors hover:text-gold-light">
                          {SITE.email}
                        </a>
                        .
                      </p>
                    </div>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
