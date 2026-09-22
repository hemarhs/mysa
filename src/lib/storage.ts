import "server-only";

import { env } from "./env";

/**
 * Image uploads sit behind this interface so the storage backend is a
 * one-file swap. Vercel Blob is the default; `local` writes into
 * public/uploads and exists only so the admin panel is usable before a Blob
 * store is connected. Never use `local` on a serverless deploy — the
 * filesystem there is ephemeral and per-instance.
 */

export type UploadResult = { url: string; key: string };

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export class UploadError extends Error {}

function assertValid(file: File) {
  if (!ALLOWED.has(file.type)) {
    throw new UploadError("Images must be JPEG, PNG, WebP or AVIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new UploadError("Images must be 8 MB or smaller.");
  }
}

function safeName(name: string) {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${cleaned}`;
}

export async function uploadImage(file: File, prefix = "gallery"): Promise<UploadResult> {
  assertValid(file);
  const key = `${prefix}/${safeName(file.name || "image.jpg")}`;

  if (env.STORAGE_PROVIDER === "local") {
    const { writeFile, mkdir } = await import("fs/promises");
    const { join, dirname } = await import("path");

    const target = join(process.cwd(), "public", "uploads", key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, Buffer.from(await file.arrayBuffer()));

    return { url: `/uploads/${key}`, key };
  }

  const { put } = await import("@vercel/blob");
  const blob = await put(key, file, {
    access: "public",
    addRandomSuffix: false,
    token: env.BLOB_READ_WRITE_TOKEN,
  });

  return { url: blob.url, key: blob.pathname };
}

export async function deleteImage(key: string | null | undefined) {
  if (!key) return;

  try {
    if (env.STORAGE_PROVIDER === "local") {
      const { unlink } = await import("fs/promises");
      const { join } = await import("path");
      await unlink(join(process.cwd(), "public", "uploads", key));
      return;
    }

    const { del } = await import("@vercel/blob");
    await del(key, { token: env.BLOB_READ_WRITE_TOKEN });
  } catch (error) {
    // A missing blob should not block deleting the database row.
    console.error("[mysa] failed to delete stored image:", error);
  }
}
