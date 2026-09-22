/**
 * Mysa diagnostics — run from the project root:
 *
 *   node --env-file=.env.local diagnose.mjs
 *
 * Checks the database connection, the tables, the row counts, and every
 * photograph URL the site references. Prints nothing secret.
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const line = (s = "") => console.log(s);
const ok = (s) => console.log("  OK    " + s);
const bad = (s) => console.log("  FAIL  " + s);

line("\n=== 1. DATABASE ===\n");

const url = process.env.DATABASE_URL;
if (!url) {
  bad("DATABASE_URL is not set. Is .env.local present, and did you use --env-file?");
} else {
  try {
    line("  host: " + new URL(url).hostname);
  } catch {
    bad("DATABASE_URL is not a valid URL — check for line breaks or missing quotes.");
  }

  const sql = neon(url);

  try {
    const tables = await sql`
      select table_name from information_schema.tables
      where table_schema = 'public' order by table_name`;
    const names = tables.map((r) => r.table_name);

    if (!names.length) {
      bad("Connected, but there are no tables. Run: npm run db:migrate");
    } else {
      ok("connected — tables: " + names.join(", "));

      const expected = [
        "admin_users", "categories", "gallery_images",
        "menu_items", "messages", "opening_hours", "site_settings",
      ];
      const missing = expected.filter((t) => !names.includes(t));
      if (missing.length) bad("missing tables: " + missing.join(", ") + "  → npm run db:migrate");

      for (const table of ["categories", "menu_items", "gallery_images", "opening_hours", "admin_users"]) {
        if (!names.includes(table)) continue;
        try {
          const [{ n }] = await sql(`select count(*)::int as n from ${table}`);
          const label = `${table}: ${n} row${n === 1 ? "" : "s"}`;
          if (n === 0 && table !== "admin_users") bad(label + "   → npm run db:seed");
          else if (n === 0) bad(label + "   → npm run db:create-admin");
          else ok(label);
        } catch (e) {
          bad(`${table}: count failed — ${e.message}`);
        }
      }
    }
  } catch (e) {
    bad("could not connect: " + e.message);
    if (e.sourceError) bad("  underlying: " + e.sourceError.message);
    if (e.cause) bad("  cause: " + (e.cause.message ?? String(e.cause)));
    line();
    line("  If this says 'fetch failed', your network is blocking the Neon host.");
    line("  Try a different network (phone hotspot), or check a VPN/firewall.");
  }
}

line("\n=== 2. PHOTOGRAPHS ===\n");

let source = "";
try {
  source = readFileSync("src/lib/images.ts", "utf8");
} catch {
  bad("could not read src/lib/images.ts — run this from the project root.");
}

const ids = [...source.matchAll(/unsplash\("([0-9a-zA-Z-]+)"/g)].map((m) => m[1]);
const keys = [...source.matchAll(/^\s{2}([a-zA-Z]+):\s*\{\s*$/gm)].map((m) => m[1]);

if (!ids.length) {
  line("  no Unsplash URLs found (already replaced with local images?)");
} else {
  const dead = [];
  await Promise.all(
    ids.map(async (id, i) => {
      const name = keys[i] ?? `#${i}`;
      const target = `https://images.unsplash.com/photo-${id}?w=200`;
      try {
        const res = await fetch(target, { method: "GET", redirect: "follow" });
        if (res.ok) ok(`${name}`);
        else { bad(`${name} → HTTP ${res.status}  (${id})`); dead.push(`${name}  ${id}`); }
      } catch (e) {
        bad(`${name} → ${e.message}  (${id})`);
        dead.push(`${name}  ${id}`);
      }
    })
  );

  line();
  if (dead.length) {
    line("  BROKEN IMAGES — paste this list back:");
    dead.forEach((d) => line("    " + d));
  } else {
    ok("all " + ids.length + " photographs load");
  }
}

line("\n=== done ===\n");
