import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession, type SessionPayload } from "./jwt";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

/**
 * Looks up the admin and checks the password. Always runs a bcrypt comparison,
 * even when the email is unknown, so response timing does not reveal which
 * addresses exist.
 */
const DUMMY_HASH = "$2b$12$sAwph6BJ5UjtP5/XbAVeKO.93BLNlP8W.7DEP6KFbEzHQvHgs.pGq";

export async function authenticate(email: string, password: string) {
  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email.toLowerCase().trim()))
    .limit(1);

  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return null;

  // Recording the login is useful but not important enough to fail the login.
  try {
    await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));
  } catch (error) {
    console.error("[mysa] could not record last login:", error);
  }

  return { id: user.id, email: user.email, name: user.name };
}

export async function createSession(user: { id: string; email: string; name: string | null }) {
  const token = await signSession({ sub: user.id, email: user.email, name: user.name });
  const store = await cookies();

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** Use at the top of any admin page or action. Redirects if not signed in. */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

export { SESSION_COOKIE };
