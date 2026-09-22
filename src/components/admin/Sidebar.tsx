"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Wordmark } from "@/components/site/Wordmark";
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
    <nav className="flex flex-col gap-1" aria-label="Admin sections">
      {LINKS.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center justify-between px-4 py-3 font-sans text-[0.9375rem] transition-colors duration-300",
              active
                ? "bg-ink text-linen"
                : "text-ink-muted hover:bg-ink/5 hover:text-ink"
            )}
          >
            {link.label}
            {(() => {
              const badge =
                link.href === "/admin/messages"
                  ? unread
                  : link.href === "/admin/reservations"
                    ? pendingReservations
                    : 0;
              if (!badge) return null;
              return (
                <span
                  className={cn(
                    "ml-3 min-w-6 rounded-full px-2 py-0.5 text-center font-sans text-[0.6875rem] tabular-nums",
                    active ? "bg-gold text-espresso" : "bg-gold/20 text-gold-dim"
                  )}
                >
                  {badge}
                </span>
              );
            })()}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile bar */}
      <div className="flex items-center justify-between border-b border-ink/12 bg-linen px-5 py-4 lg:hidden">
        <Link href="/admin">
          <Wordmark className="text-ink" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="font-sans text-[0.75rem] uppercase tracking-[0.16em] text-ink-muted"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <div className="border-b border-ink/12 bg-linen p-4 lg:hidden">{nav}</div>
      ) : null}

      {/* Desktop rail */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-ink/12 bg-linen-deep/40 p-6 lg:flex">
        <div>
          <Link href="/admin" className="block px-4">
            <Wordmark className="text-ink" />
            <span className="mt-1.5 block font-sans text-[0.6875rem] uppercase tracking-[0.18em] text-ink-muted">
              Admin
            </span>
          </Link>

          <div className="mt-10">{nav}</div>
        </div>

        <div className="border-t border-ink/12 pt-5">
          <p className="px-4 font-sans text-[0.8125rem] text-ink">{user.name || "Signed in"}</p>
          <p className="mt-0.5 truncate px-4 font-sans text-[0.75rem] text-ink-muted">
            {user.email}
          </p>

          <div className="mt-4 flex flex-col gap-1">
            <Link
              href="/"
              target="_blank"
              className="px-4 py-2 font-sans text-[0.8125rem] text-ink-muted transition-colors hover:text-ink"
            >
              View site ↗
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="w-full px-4 py-2 text-left font-sans text-[0.8125rem] text-ink-muted transition-colors hover:text-terracotta"
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
