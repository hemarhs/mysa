"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Wordmark } from "@/components/brand/Wordmark";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/hours", label: "Hours & location" },
  { href: "/admin/reservations", label: "Reservations" },
  { href: "/admin/messages", label: "Messages" },
];

type Props = {
  user: { email: string; name?: string | null };
  unread: number;
  pendingReservations: number;
  logout: () => Promise<void>;
};

export function Sidebar({ user, unread, pendingReservations, logout }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col" aria-label="Admin sections">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);

        const badge =
          link.href === "/admin/messages"
            ? unread
            : link.href === "/admin/reservations"
              ? pendingReservations
              : 0;

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group/row relative flex items-center justify-between py-3 pl-5 pr-4",
              "font-sans text-[0.9375rem] transition-colors duration-300",
              active
                ? "bg-espresso text-cream"
                : "text-mocha hover:bg-espresso/[0.05] hover:text-espresso"
            )}
          >
            {/* Gold marker on the active row — quieter than a filled block
                and it survives the row being dark. */}
            <span
              className={cn(
                "absolute inset-y-0 left-0 w-0.5 transition-colors duration-300",
                active ? "bg-gold" : "bg-transparent"
              )}
              aria-hidden
            />
            {link.label}
            {badge ? (
              <span
                className={cn(
                  "ml-3 min-w-6 px-2 py-0.5 text-center font-sans text-[0.625rem] font-semibold tnum",
                  active ? "bg-gold text-espresso" : "bg-gold-ink/15 text-gold-ink"
                )}
              >
                {badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile bar */}
      <div className="flex items-center justify-between border-b border-hairline-ink bg-cream px-5 py-4 lg:hidden">
        <Link href="/admin" className="flex items-center gap-3 text-espresso">
          <Wordmark className="h-3.5" />
          <span className="font-sans text-[0.5625rem] font-semibold uppercase tracking-[0.24em] text-mocha">
            Admin
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-mocha transition-colors hover:text-espresso"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <div className="border-b border-hairline-ink bg-cream py-2 lg:hidden">{nav}</div>
      ) : null}

      {/* Desktop rail */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-hairline-ink bg-cream-dim/50 py-6 lg:flex">
        <div>
          <Link href="/admin" className="block px-5 text-espresso">
            <Wordmark className="h-4" />
            <span className="mt-2 block font-sans text-[0.5625rem] font-semibold uppercase tracking-[0.24em] text-mocha">
              Admin
            </span>
          </Link>

          <div className="mt-10">{nav}</div>
        </div>

        <div className="mt-10 border-t border-hairline-ink px-5 pt-5">
          <p className="font-sans text-[0.8125rem] text-espresso">
            {user.name || "Signed in"}
          </p>
          <p className="mt-0.5 truncate font-sans text-[0.75rem] text-mocha">
            {user.email}
          </p>

          <div className="mt-5 flex flex-col items-start gap-2">
            <Link
              href="/"
              target="_blank"
              className="font-sans text-[0.8125rem] text-mocha transition-colors duration-300 hover:text-gold-ink"
            >
              View site ↗
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="font-sans text-[0.8125rem] text-mocha transition-colors duration-300 hover:text-alert"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
