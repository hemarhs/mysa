import { EmptyState, PageTitle, Pill } from "@/components/admin/ui";
import { deleteMessage, setMessageStatus } from "@/app/(admin)/admin/actions";
import { getMessages } from "@/lib/db/queries";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "", label: "All" },
  { value: "new", label: "Unread" },
  { value: "read", label: "Read" },
  { value: "archived", label: "Archived" },
] as const;

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const valid = status === "new" || status === "read" || status === "archived" ? status : undefined;
  const messages = await getMessages(valid);

  return (
    <div className="space-y-10">
      <PageTitle
        title="Messages"
        description="Everything sent through the contact form. Replies go from your own email — this is a record, not an inbox."
      />

      <nav className="flex flex-wrap gap-2" aria-label="Filter messages">
        {FILTERS.map((filter) => {
          const active = (valid ?? "") === filter.value;
          return (
            <a
              key={filter.label}
              href={filter.value ? `/admin/messages?status=${filter.value}` : "/admin/messages"}
              className={cn(
                "border px-4 py-2 font-sans text-[0.75rem] font-medium uppercase tracking-[0.14em] transition-colors duration-300",
                active
                  ? "border-espresso bg-espresso text-cream"
                  : "border-espresso/20 text-mocha hover:border-espresso/45 hover:text-espresso"
              )}
            >
              {filter.label}
            </a>
          );
        })}
      </nav>

      {messages.length ? (
        <ul className="space-y-4">
          {messages.map((message) => (
            <li
              key={message.id}
              className={cn(
                "border p-6",
                message.status === "new" ? "border-gold-ink/40 bg-gold/5" : "border-espresso/12 bg-cream"
              )}
            >
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <h2 className="font-display text-[1.25rem] font-light text-espresso">{message.name}</h2>
                <a
                  href={`mailto:${message.email}?subject=${encodeURIComponent(
                    `Re: ${message.subject || "your note to Mysa"}`
                  )}`}
                  className="font-sans text-[0.875rem] text-mocha underline decoration-ink/20 underline-offset-4 transition-colors hover:text-espresso"
                >
                  {message.email}
                </a>
                {message.status === "new" ? <Pill tone="gold">New</Pill> : null}
                {message.status === "archived" ? <Pill>Archived</Pill> : null}
                <time
                  dateTime={message.createdAt.toISOString()}
                  className="ml-auto font-sans text-[0.8125rem] tabular-nums text-mocha"
                >
                  {message.createdAt.toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>

              {message.subject ? (
                <p className="mt-3 font-sans text-[0.9375rem] font-medium text-espresso">
                  {message.subject}
                </p>
              ) : null}

              <p className="mt-3 whitespace-pre-line text-[0.9375rem] leading-[1.75] text-mocha">
                {message.body}
              </p>

              <div className="mt-6 flex flex-wrap gap-2 border-t border-espresso/10 pt-4">
                {message.status !== "read" ? (
                  <form action={setMessageStatus}>
                    <input type="hidden" name="id" value={message.id} />
                    <input type="hidden" name="status" value="read" />
                    <button
                      type="submit"
                      className="border border-espresso/20 px-3 py-1.5 font-sans text-[0.625rem] uppercase tracking-[0.14em] text-mocha transition-colors hover:border-espresso/45 hover:text-espresso"
                    >
                      Mark read
                    </button>
                  </form>
                ) : null}

                {message.status !== "archived" ? (
                  <form action={setMessageStatus}>
                    <input type="hidden" name="id" value={message.id} />
                    <input type="hidden" name="status" value="archived" />
                    <button
                      type="submit"
                      className="border border-espresso/20 px-3 py-1.5 font-sans text-[0.625rem] uppercase tracking-[0.14em] text-mocha transition-colors hover:border-espresso/45 hover:text-espresso"
                    >
                      Archive
                    </button>
                  </form>
                ) : (
                  <form action={setMessageStatus}>
                    <input type="hidden" name="id" value={message.id} />
                    <input type="hidden" name="status" value="read" />
                    <button
                      type="submit"
                      className="border border-espresso/20 px-3 py-1.5 font-sans text-[0.625rem] uppercase tracking-[0.14em] text-mocha transition-colors hover:border-espresso/45 hover:text-espresso"
                    >
                      Restore
                    </button>
                  </form>
                )}

                <form action={deleteMessage} className="ml-auto">
                  <input type="hidden" name="id" value={message.id} />
                  <button
                    type="submit"
                    className="px-3 py-1.5 font-sans text-[0.625rem] uppercase tracking-[0.14em] text-mocha transition-colors hover:text-alert"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Nothing here"
          body="No messages match this filter. Anything sent through the contact form lands here straight away."
        />
      )}
    </div>
  );
}
