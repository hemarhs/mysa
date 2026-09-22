import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { env } from "@/lib/env";
import { installResilientFetch } from "./resilient-fetch";
import * as schema from "./schema";

/**
 * Neon over HTTP: one round trip per query, no connection pool to exhaust,
 * which is what you want on serverless. Cached on globalThis so dev hot
 * reloads do not open a new client on every edit.
 */
// Must run before the first query is issued.
installResilientFetch();

const globalForDb = globalThis as unknown as {
  __mysaDb?: ReturnType<typeof drizzle<typeof schema>>;
};

export const db =
  globalForDb.__mysaDb ?? drizzle(neon(env.DATABASE_URL), { schema, casing: "snake_case" });

if (env.NODE_ENV !== "production") globalForDb.__mysaDb = db;

export { schema };
