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

  const env = parsed.data;

  if (env.STORAGE_PROVIDER === "blob" && env.NODE_ENV === "production" && !env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "STORAGE_PROVIDER is 'blob' but BLOB_READ_WRITE_TOKEN is not set. Connect a Blob store in the Vercel dashboard, or set STORAGE_PROVIDER=local."
    );
  }

  return env;
}

export const env = load();
