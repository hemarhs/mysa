import Link from "next/link";

import { Card, EmptyState, PageTitle, Pill } from "@/components/admin/ui";
import { getDashboardStats, getMessages, getUpcomingReservations } from "@/lib/db/queries";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <Card className="flex flex-col justify-between">
      <span className="font-sans text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-ink-muted">
        {label}
      </span>
      <span className="mt-6 font-serif text-[2.75rem] font-light leading-none tabular-nums text-ink">
        {value}
      </span>
      {hint ? <span className="mt-2 text-[0.8125rem] text-ink-muted">{hint}</span> : null}
    </Card>
  );
}

export default async function AdminOverview() {
  const session = await requireAdmin();
  const [stats, recent, upcoming] = await Promise.all([
    getDashboardStats(),
    getMessages(),
    getUpcomingReservations(5),
  ]);
  const latest = recent.slice(0, 5);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-10">
      <PageTitle
        title={`${greeting}${session.name ? `, ${session.name.split(" ")[0]}` : ""}.`}
        description="Everything the public site shows, in one place. Changes go live within a few seconds of saving."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Items on the menu" value={stats.activeItems} hint="Active and visible" />
        <Stat label="House picks" value={stats.featuredItems} hint="Shown on the home page" />
        <Stat label="Sold out" value={stats.soldOutItems} hint="Still listed, marked out" />
        <Stat label="Tables to answer" value={stats.pendingReservations} hint="Awaiting confirmation" />
      </div>

      <section>
        <div className="flex items-end justify-between border-b border-ink/12 pb-4">
          <h2 className="font-serif text-[1.5rem] font-light text-ink">Coming up</h2>
          <Link
            href="/admin/reservations"
            className="font-sans text-[0.75rem] uppercase tracking-[0.14em] text-ink-muted transition-colors hover:text-ink"
          >
            All reservations →
          </Link>
        </div>

        {upcoming.length ? (
          <ul className="divide-y divide-ink/10">
            {upcoming.map((booking) => (
              <li key={booking.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-2 py-4">
                <span className="font-sans text-[0.9375rem] tabular-nums text-ink">
                  {new Date(`${booking.date}T00:00:00`).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <span className="font-sans text-[0.875rem] tabular-nums text-ink-muted">{booking.time}</span>
                <span className="text-[0.9375rem] text-ink">{booking.name}</span>
                <span className="text-[0.875rem] text-ink-muted">
                  {booking.partySize} {booking.partySize === 1 ? "person" : "people"}
                </span>
                {booking.status === "pending" ? <Pill tone="gold">Pending</Pill> : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className="pt-6">
            <EmptyState
              title="Nothing booked yet"
              body="Requests from the Reserve button on the site show up here."
            />
          </div>
        )}
      </section>

      <section>
        <div className="flex items-end justify-between border-b border-ink/12 pb-4">
          <h2 className="font-serif text-[1.5rem] font-light text-ink">Recent messages</h2>
          <Link
            href="/admin/messages"
            className="font-sans text-[0.75rem] uppercase tracking-[0.14em] text-ink-muted transition-colors hover:text-ink"
          >
            All messages →
          </Link>
        </div>

        {latest.length ? (
          <ul className="divide-y divide-ink/10">
            {latest.map((message) => (
              <li key={message.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-2 py-4">
                <span className="font-sans text-[0.9375rem] text-ink">{message.name}</span>
                {message.status === "new" ? <Pill tone="gold">New</Pill> : null}
                <span className="min-w-0 flex-1 truncate text-[0.875rem] text-ink-muted">
                  {message.subject || message.body.slice(0, 90)}
                </span>
                <time
                  dateTime={message.createdAt.toISOString()}
                  className="shrink-0 font-sans text-[0.8125rem] tabular-nums text-ink-muted/80"
                >
                  {message.createdAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <div className="pt-6">
            <EmptyState
              title="No messages yet"
              body="Anything sent through the contact form will land here."
            />
          </div>
        )}
      </section>
    </div>
  );
}
