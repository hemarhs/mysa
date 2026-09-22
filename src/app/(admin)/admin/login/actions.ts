"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authenticate, createSession } from "@/lib/auth";
import { clientIp, pruneRateLimits, rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };
  }

  const ip = clientIp(await headers());
  pruneRateLimits();

  // Five attempts per fifteen minutes, per address.
  const limit = rateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.ok) {
    return {
      error: `Too many attempts. Try again in about ${Math.ceil(limit.retryAfter / 60)} minutes.`,
    };
  }

  let user: Awaited<ReturnType<typeof authenticate>>;
  try {
    user = await authenticate(parsed.data.email, parsed.data.password);
  } catch (error) {
    // A database failure here must not surface as an unhandled runtime error.
    console.error("[mysa] login failed to reach the database:", error);
    return {
      error:
        "We could not reach the database. Check DATABASE_URL in .env.local, and that the tables exist (npm run db:migrate).",
    };
  }

  // One message for both cases — never reveal which addresses exist.
  if (!user) return { error: "Those details did not match. Please try again." };

  try {
    await createSession(user);
  } catch (error) {
    console.error("[mysa] could not create session:", error);
    return { error: "Could not start a session. Check that AUTH_SECRET is set in .env.local." };
  }

  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout() {
  const { destroySession } = await import("@/lib/auth");
  await destroySession();
  redirect("/admin/login");
}
