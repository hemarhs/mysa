import { EmptyState, PageTitle, Pill } from "@/components/admin/ui";
import { deleteReservation, setReservationStatus } from "@/app/(admin)/admin/actions";
import { getReservations } from "@/lib/db/queries";
import { cn } from "@/lib/cn";
import type { ReservationStatus } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "declined", label: "Declined" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const STATUS_TONE: Record<ReservationStatus, "neutral" | "gold" | "terracotta"> = {
  pending: "gold",
  confirmed: "neutral",
  declined: "terracotta",
  cancelled: "terracotta",
};

function prettyTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const valid = FILTERS.some((f) => f.value && f.value === status)
    ? (status as ReservationStatus)
    : undefined;

  const bookings = await getReservations(valid);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-10">
      <PageTitle
        title="Reservations"
        description="Requests from the Reserve button. Confirming does not send an email automatically — reply from your own inbox, then mark it confirmed here."
      />

      <nav className="flex flex-wrap gap-2" aria-label="Filter reservations">
        {FILTERS.map((filter) => {
          const active = (valid ?? "") === filter.value;
          return (
            <a
              key={filter.label}
              href={filter.value ? `/admin/reservations?status=${filter.value}` : "/admin/reservations"}
              className={cn(
                "border px-4 py-2 font-sans text-[0.75rem] font-medium uppercase tracking-[0.14em] transition-colors duration-300",
                active
                  ? "border-ink bg-ink text-linen"
                  : "border-ink/20 text-ink-muted hover:border-ink/45 hover:text-ink"
              )}
            >
              {filter.label}
            </a>
          );
        })}
      </nav>

      {bookings.length ? (
        <ul className="space-y-4">
          {bookings.map((booking) => {
            const past = booking.date < today;
            return (
              <li
                key={booking.id}
                className={cn(
                  "border p-6",
                  booking.status === "pending"
                    ? "border-gold-dim/40 bg-gold/5"
                    : "border-ink/12 bg-linen",
                  past && "opacity-60"
                )}
              >
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                  <h2 className="font-serif text-[1.375rem] font-light text-ink">
                    {new Date(`${booking.date}T00:00:00`).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                    })}
                    <span className="mx-2 text-ink-muted">·</span>
                    {prettyTime(booking.time)}
                  </h2>

                  <span className="font-sans text-[0.9375rem] text-ink">
                    {booking.partySize} {booking.partySize === 1 ? "person" : "people"}
                  </span>

                  <Pill tone={STATUS_TONE[booking.status]}>{booking.status}</Pill>
                  {past ? <Pill>Past</Pill> : null}

                  <time
                    dateTime={booking.createdAt.toISOString()}
                    className="ml-auto font-sans text-[0.8125rem] tabular-nums text-ink-muted"
                  >
                    requested {booking.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </time>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.9375rem]">
                  <span className="text-ink">{booking.name}</span>
                  <a
                    href={`mailto:${booking.email}?subject=${encodeURIComponent(
                      `Your table at Mysa — ${booking.date}`
                    )}`}
                    className="text-ink-muted underline decoration-ink/20 underline-offset-4 transition-colors hover:text-ink"
                  >
                    {booking.email}
                  </a>
                  {booking.phone ? <span className="text-ink-muted">{booking.phone}</span> : null}
                  {booking.occasion ? <Pill>{booking.occasion}</Pill> : null}
                </div>

                {booking.notes ? (
                  <p className="mt-4 whitespace-pre-line border-l-2 border-ink/15 pl-4 text-[0.9375rem] leading-[1.7] text-ink-muted">
                    {booking.notes}
                  </p>
                ) : null}

                <div className="mt-6 flex flex-wrap gap-2 border-t border-ink/10 pt-4">
                  {booking.status !== "confirmed" ? (
                    <form action={setReservationStatus}>
                      <input type="hidden" name="id" value={booking.id} />
                      <input type="hidden" name="status" value="confirmed" />
                      <button
                        type="submit"
                        className="border border-gold-dim/50 bg-gold/10 px-3 py-1.5 font-sans text-[0.625rem] uppercase tracking-[0.14em] text-gold-dim transition-colors hover:bg-gold/20"
                      >
                        Confirm
                      </button>
                    </form>
                  ) : null}

                  {booking.status !== "declined" ? (
                    <form action={setReservationStatus}>
                      <input type="hidden" name="id" value={booking.id} />
                      <input type="hidden" name="status" value="declined" />
                      <button
                        type="submit"
                        className="border border-ink/20 px-3 py-1.5 font-sans text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted transition-colors hover:border-ink/45 hover:text-ink"
                      >
                        Decline
                      </button>
                    </form>
                  ) : null}

                  {booking.status !== "pending" ? (
                    <form action={setReservationStatus}>
                      <input type="hidden" name="id" value={booking.id} />
                      <input type="hidden" name="status" value="pending" />
                      <button
                        type="submit"
                        className="border border-ink/20 px-3 py-1.5 font-sans text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted transition-colors hover:border-ink/45 hover:text-ink"
                      >
                        Back to pending
                      </button>
                    </form>
                  ) : null}

                  <form action={deleteReservation} className="ml-auto">
                    <input type="hidden" name="id" value={booking.id} />
                    <button
                      type="submit"
                      className="px-3 py-1.5 font-sans text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted transition-colors hover:text-terracotta"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          title="No reservations"
          body="Requests made through the Reserve button on the site appear here."
        />
      )}
    </div>
  );
}
