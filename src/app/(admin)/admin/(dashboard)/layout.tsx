import { Sidebar } from "@/components/admin/Sidebar";
import { requireAdmin } from "@/lib/auth";
import { getDashboardStats } from "@/lib/db/queries";
import { logout } from "../login/actions";

/**
 * Every page under this layout is behind the session check. Middleware already
 * blocks unauthenticated requests at the edge; this is the second gate, and
 * the one that actually loads the user.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  let unread = 0;
  let pendingReservations = 0;
  try {
    const stats = await getDashboardStats();
    unread = stats.unreadMessages;
    pendingReservations = stats.pendingReservations;
  } catch {
    // A failed count should not take the whole panel down.
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar
        user={{ email: session.email, name: session.name }}
        unread={unread}
        pendingReservations={pendingReservations}
        logout={logout}
      />
      <main className="flex-1 overflow-x-hidden px-5 py-8 md:px-10 md:py-12">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
