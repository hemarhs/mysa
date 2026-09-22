import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySession } from "@/lib/auth/jwt";

/**
 * Guards the admin area at the edge, before any page or route handler runs.
 * Pages and actions re-check the session server-side as well — this is the
 * first gate, not the only one.
 *
 * Named `proxy`, in `src/proxy.ts`. Next 16 deprecated the `middleware` file
 * convention and renamed it; the old name still works but prints a warning on
 * every build, and shipping a build that warns trains everyone to stop reading
 * build output. Behaviour is identical.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  if (pathname === "/admin/login") {
    if (session) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const url = new URL("/admin/login", request.url);
    // Remember where they were headed so login can send them back.
    if (pathname !== "/admin") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
