import { createHash } from "crypto";

/**
 * Small fixed-window limiter held in module memory.
 *
 * This is deliberately simple: it protects a single serverless instance from
 * a burst without adding a Redis dependency to a site of this size. If Mysa
 * ever needs limits enforced across every instance, swap the Map for Upstash
 * Redis — the call signature stays the same.
 */
type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (entry.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return { ok: true, remaining: limit - entry.count, retryAfter: 0 };
}

/** Never store a raw IP; a salted hash is enough to rate limit and audit. */
export function hashIp(ip: string) {
  return createHash("sha256")
    .update(`${ip}:${process.env.AUTH_SECRET ?? "mysa"}`)
    .digest("hex")
    .slice(0, 64);
}

export function clientIp(headers: Headers) {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Periodically drop expired buckets so the map cannot grow without bound. */
export function pruneRateLimits() {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}
