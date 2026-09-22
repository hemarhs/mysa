import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

import { installResilientFetch } from "./resilient-fetch";

installResilientFetch({ verbose: true });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local first.");
  }

  const db = drizzle(neon(url));

  console.log("\nApplying migrations…");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied.\n");
  console.log("Next: npm run db:seed\n");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  const cause = (error as { sourceError?: Error })?.sourceError?.message ?? "";
  const text = `${message} ${cause}`;

  console.error("\nMigration failed: " + message);

  if (/fetch failed|ENOTFOUND|EAI_AGAIN|network/i.test(text)) {
    console.error(
      "\nThe database could not be reached, even after retrying.\n" +
        "  • Check the connection with:  node --env-file=.env.local scripts/netcheck.mjs\n" +
        "  • Flush DNS:                  ipconfig /flushdns\n" +
        "  • Disconnect any VPN, or try a phone hotspot."
    );
  } else if (/password authentication|role .* does not exist/i.test(text)) {
    console.error(
      "\nThe credentials were rejected. Copy the connection string again from the\n" +
        "Neon Connect panel using 'Copy snippet' — selecting the text by hand gives\n" +
        "you the masked password rather than the real one."
    );
  }

  console.error("");
  process.exit(1);
});
