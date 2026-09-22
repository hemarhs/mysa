"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { AdminButton, Card, EmptyState, Input, Label, Pill, Select } from "@/components/admin/ui";
import {
  addGalleryImage,
  deleteGalleryImage,
  moveGalleryImage,
  type ActionState,
} from "@/app/(admin)/admin/actions";
import { BLUR } from "@/lib/images";
import type { GalleryImage } from "@/lib/db/schema";

const CATEGORY_LABEL: Record<string, string> = {
  space: "The room",
  drinks: "Drinks",
  desserts: "Desserts",
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <AdminButton type="submit" disabled={pending}>
      {pending ? "Adding…" : "Add photograph"}
    </AdminButton>
  );
}

export function GalleryManager({ images }: { images: GalleryImage[] }) {
  const [state, formAction] = useActionState<ActionState, FormData>(addGalleryImage, {
    status: "idle",
  });

  const [url, setUrl] = useState("");
  const [storageKey, setStorageKey] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Clear the form once, on the render where the action first reports success.
  // Bumping `formKey` remounts the form, which resets the uncontrolled fields;
  // doing this during render avoids the cascading re-render an effect causes.
  const [seenState, setSeenState] = useState(state);
  const [formKey, setFormKey] = useState(0);

  if (state !== seenState) {
    setSeenState(state);
    if (state.status === "success") {
      setUrl("");
      setStorageKey("");
      setUploadError(null);
      setFormKey((key) => key + 1);
    }
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const body = new FormData();
      body.set("file", file);
      body.set("prefix", "gallery");

      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error ?? "Upload failed.");

      setUrl(data.url);
      setStorageKey(data.key);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-10">
      <Card>
        <h2 className="font-display text-[1.375rem] font-light text-espresso">Add a photograph</h2>
        <p className="mt-2 max-w-lg text-[0.875rem] leading-relaxed text-mocha">
          Upload a file, or paste a URL if the image is already hosted somewhere.
          JPEG, PNG, WebP or AVIF, up to 8&nbsp;MB.
        </p>

        <form key={formKey} action={formAction} className="mt-7 space-y-6">
          {state.status === "error" ? (
            <p role="alert" className="border-l-2 border-alert bg-alert/8 py-3 pl-4 text-[0.875rem] text-alert">
              {state.message}
            </p>
          ) : null}
          {uploadError ? (
            <p role="alert" className="border-l-2 border-alert bg-alert/8 py-3 pl-4 text-[0.875rem] text-alert">
              {uploadError}
            </p>
          ) : null}

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="file">Upload</Label>
              <input
                id="file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleFile}
                disabled={uploading}
                className="mt-2 w-full cursor-pointer border border-espresso/18 bg-white/60 px-3.5 py-2.5 font-sans text-[0.875rem] text-espresso file:mr-4 file:border-0 file:bg-espresso file:px-3 file:py-1.5 file:font-sans file:text-[0.75rem] file:uppercase file:tracking-[0.12em] file:text-cream"
              />
              {uploading ? (
                <p className="mt-2 text-[0.8125rem] text-mocha">Uploading…</p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="url">Image URL</Label>
              <Input
                id="url"
                name="url"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>

            <div>
              <Label htmlFor="alt">Alt text</Label>
              <Input id="alt" name="alt" required maxLength={300} placeholder="The bar, late afternoon" />
              <p className="mt-2 text-[0.8125rem] text-mocha">
                Describes the image for screen readers. Required.
              </p>
            </div>

            <div>
              <Label htmlFor="caption">Caption</Label>
              <Input id="caption" name="caption" maxLength={300} placeholder="Shown under the photo" />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select id="category" name="category" defaultValue="space">
                <option value="space">The room</option>
                <option value="drinks">Drinks</option>
                <option value="desserts">Desserts</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="position">Order</Label>
              <Input id="position" name="position" type="number" min={0} defaultValue={images.length} />
            </div>
          </div>

          <input type="hidden" name="storageKey" value={storageKey} />

          <Submit />
        </form>
      </Card>

      {images.length ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <li key={image.id} className="border border-espresso/12 bg-cream">
              <div className="relative aspect-4/3 overflow-hidden bg-cream-dim">
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  placeholder="blur"
                  blurDataURL={BLUR}
                  className="object-cover"
                  unoptimized={image.url.startsWith("/uploads/")}
                />
              </div>

              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <Pill>{CATEGORY_LABEL[image.category] ?? image.category}</Pill>
                  <span className="font-sans text-[0.75rem] tabular-nums text-mocha">
                    #{image.position}
                  </span>
                </div>

                <p className="line-clamp-2 text-[0.875rem] leading-relaxed text-espresso">
                  {image.caption || image.alt}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <form action={moveGalleryImage} className="flex items-center gap-1.5">
                    <input type="hidden" name="id" value={image.id} />
                    <label htmlFor={`pos-${image.id}`} className="sr-only">
                      Position for {image.alt}
                    </label>
                    <input
                      id={`pos-${image.id}`}
                      name="position"
                      type="number"
                      min={0}
                      defaultValue={image.position}
                      className="w-16 border border-espresso/18 bg-white/60 px-2 py-1 font-sans text-[0.8125rem] text-espresso"
                    />
                    <button
                      type="submit"
                      className="border border-espresso/20 px-2.5 py-1 font-sans text-[0.625rem] uppercase tracking-[0.14em] text-mocha transition-colors hover:text-espresso"
                    >
                      Move
                    </button>
                  </form>

                  <form action={deleteGalleryImage} className="ml-auto">
                    <input type="hidden" name="id" value={image.id} />
                    <button
                      type="submit"
                      className="px-2.5 py-1 font-sans text-[0.625rem] uppercase tracking-[0.14em] text-mocha transition-colors hover:text-alert"
                    >
                      Remove
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No photographs yet"
          body="Add the first one above. They appear on the gallery page in the order you set."
        />
      )}
    </div>
  );
}
