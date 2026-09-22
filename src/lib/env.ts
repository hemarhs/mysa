import { z } from "zod";

/**
 * Validates environment configuration once, at module load, so a
 * misconfigured deploy fails loudly at boot instead of silently at the first
 * database query.
 */
const schema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required — add your Neon connection string.")
    .refine((v) => v.startsWith("postgres://") || v.startsWith("postgresql://"), {
      message: "DATABASE_URL must be a postgres:// or postgresql:// connection string.",
    }),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters. Generate one with: openssl rand -base64 48"),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  STORAGE_PROVIDER: z.enum(["blob", "local"]).default("blob"),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

function load() {
  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration:\n${issues}\n\nCopy .env.example to .env.local and fill in the values.`
    );
  }

  return parsed.data;
}

export const env = load();

/**
 * Is blob storage actually usable?
 *
 * This used to be a `throw` inside `load()`, which meant it ran at module
 * evaluation — and Next evaluates every module while collecting page data
 * during `next build`, with NODE_ENV set to "production". The result was that
 * a deploy without a Blob token did not fail at upload time with a clear
 * message; it failed the *build*:
 *
 *     Error: Failed to collect page data for /api/admin/upload
 *     [cause]: STORAGE_PROVIDER is 'blob' but BLOB_READ_WRITE_TOKEN is not set
 *
 * A missing optional integration should never be able to stop a site from
 * building. The check belongs where the capability is used, so the site
 * deploys, every public page works, and only the one action that genuinely
 * needs the token reports that it is missing.
 */
export function blobStorageReady(): boolean {
  return env.STORAGE_PROVIDER !== "blob" || Boolean(env.BLOB_READ_WRITE_TOKEN);
}

export const BLOB_SETUP_MESSAGE =
  "Image storage is not configured. Connect a Blob store in the Vercel dashboard " +
  "(Storage → Create → Blob), which sets BLOB_READ_WRITE_TOKEN automatically, or " +
  "set STORAGE_PROVIDER=local for local development.";

