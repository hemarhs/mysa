/**
 * Creates or updates an admin user.
 *
 *   npm run db:create-admin
 *
 * Prompts for email and password rather than taking them as arguments, so the
 * password never lands in shell history. There is deliberately no default
 * account and no seeded password.
 */
import { createInterface } from "readline/promises";
import { stdin, stdout } from "process";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { adminUsers } from "../src/lib/db/schema";
import { installResilientFetch } from "../src/lib/db/resilient-fetch";

installResilientFetch({ verbose: true });

async function prompt(question: string, mask = false) {
  const rl = createInterface({ input: stdin, output: stdout, terminal: true });

  if (!mask) {
    const answer = await rl.question(question);
    rl.close();
    return answer.trim();
  }

  // Suppress echo while the password is typed.
  const answerPromise = rl.question(question);
  const onData = (char: Buffer) => {
    const s = char.toString();
    if (s === "\n" || s === "\r" || s === "\u0004") return;
    stdout.write("\u001b[2K\u001b[200D" + question + "*".repeat(rl.line.length));
  };
  stdin.on("data", onData);

  const answer = await answerPromise;
  stdin.off("data", onData);
  rl.close();
  stdout.write("\n");
  return answer.trim();
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add it to .env.local first.");

  const db = drizzle(neon(url));

  const email = (await prompt("Admin email: ")).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error("That is not a valid email address.");
  }

  const name = await prompt("Display name (optional): ");
  const password = await prompt("Password (min 12 characters): ", true);

  if (password.length < 12) {
    throw new Error("Password must be at least 12 characters.");
  }

  const confirm = await prompt("Confirm password: ", true);
  if (password !== confirm) throw new Error("Passwords do not match.");

  const passwordHash = await bcrypt.hash(password, 12);

  const [existing] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);

  if (existing) {
    await db
      .update(adminUsers)
      .set({ passwordHash, name: name || null })
      .where(eq(adminUsers.id, existing.id));
    console.log(`\nUpdated the password for ${email}.`);
  } else {
    await db.insert(adminUsers).values({ email, name: name || null, passwordHash });
    console.log(`\nCreated admin user ${email}.`);
  }

  console.log("Sign in at /admin/login\n");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("\n" + message);

  if (/relation .* does not exist/i.test(message)) {
    console.error("\nThe tables do not exist yet. Run:  npm run db:migrate\n");
  } else if (/fetch failed|ENOTFOUND|network/i.test(message)) {
    console.error(
      "\nThe database could not be reached. Check it with:\n" +
        "  node --env-file=.env.local netcheck.mjs\n"
    );
  } else {
    console.error("");
  }

  process.exit(1);
});
