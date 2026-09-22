"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  categories,
  galleryImages,
  menuItems,
  messages,
  openingHours,
  reservations,
  siteSettings,
} from "@/lib/db/schema";
import { deleteImage } from "@/lib/storage";
import {
  categorySchema,
  galleryImageSchema,
  hoursSchema,
  menuItemSchema,
  messageStatusSchema,
  reservationStatusSchema,
  settingsSchema,
} from "@/lib/validation";

export type ActionState = { status: "idle" | "success" | "error"; message?: string };

/** Public pages that depend on database content. */
function revalidatePublic() {
  revalidatePath("/", "page");
  revalidatePath("/menu");
  revalidatePath("/gallery");
  revalidatePath("/contact");
}

function firstIssue(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}

function fail(message: string): ActionState {
  return { status: "error", message };
}

function ok(message: string): ActionState {
  return { status: "success", message };
}

/* ------------------------------- menu items ------------------------------ */

function menuItemFromForm(formData: FormData) {
  return menuItemSchema.safeParse({
    categoryId: String(formData.get("categoryId") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: String(formData.get("price") ?? "0"),
    imageUrl: String(formData.get("imageUrl") ?? ""),
    tags: String(formData.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    isFeatured: formData.get("isFeatured") === "on",
    isSoldOut: formData.get("isSoldOut") === "on",
    isActive: formData.get("isActive") !== null ? formData.get("isActive") === "on" : true,
    position: String(formData.get("position") ?? "0"),
  });
}

export async function createMenuItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = menuItemFromForm(formData);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const { price, description, imageUrl, ...rest } = parsed.data;

  try {
    await db.insert(menuItems).values({
      ...rest,
      description: description || null,
      imageUrl: imageUrl || null,
      priceCents: price,
    });
  } catch (error) {
    console.error("[mysa] createMenuItem failed:", error);
    return fail("Could not save the item. Please try again.");
  }

  revalidatePublic();
  revalidatePath("/admin/menu");
  return ok("Item added.");
}

export async function updateMenuItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return fail("Missing item reference.");

  const parsed = menuItemFromForm(formData);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const { price, description, imageUrl, ...rest } = parsed.data;

  try {
    await db
      .update(menuItems)
      .set({
        ...rest,
        description: description || null,
        imageUrl: imageUrl || null,
        priceCents: price,
        updatedAt: new Date(),
      })
      .where(eq(menuItems.id, id));
  } catch (error) {
    console.error("[mysa] updateMenuItem failed:", error);
    return fail("Could not save your changes. Please try again.");
  }

  revalidatePublic();
  revalidatePath("/admin/menu");
  return ok("Saved.");
}

export async function deleteMenuItem(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.delete(menuItems).where(eq(menuItems.id, id));
  revalidatePublic();
  revalidatePath("/admin/menu");
}

/** Used by the sold-out and featured switches in the menu table. */
export async function toggleMenuItemFlag(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const field = String(formData.get("field") ?? "");
  const value = formData.get("value") === "true";

  if (!id || !["isFeatured", "isSoldOut", "isActive"].includes(field)) return;

  await db
    .update(menuItems)
    .set({ [field]: value, updatedAt: new Date() })
    .where(eq(menuItems.id, id));

  revalidatePublic();
  revalidatePath("/admin/menu");
}

/* ------------------------------- categories ------------------------------ */

export async function createCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? ""),
    position: String(formData.get("position") ?? "0"),
  });
  if (!parsed.success) return fail(firstIssue(parsed.error));

  try {
    await db.insert(categories).values({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      position: parsed.data.position ?? 0,
    });
  } catch (error) {
    console.error("[mysa] createCategory failed:", error);
    return fail("Could not add the category — the slug may already be in use.");
  }

  revalidatePublic();
  revalidatePath("/admin/menu");
  return ok("Category added.");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Items cascade with the category — the schema declares onDelete: cascade.
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePublic();
  revalidatePath("/admin/menu");
}

/* --------------------------------- gallery ------------------------------- */

export async function addGalleryImage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = galleryImageSchema.safeParse({
    url: String(formData.get("url") ?? ""),
    alt: String(formData.get("alt") ?? ""),
    caption: String(formData.get("caption") ?? ""),
    category: String(formData.get("category") ?? "space"),
    storageKey: String(formData.get("storageKey") ?? "") || undefined,
    position: String(formData.get("position") ?? "0"),
  });
  if (!parsed.success) return fail(firstIssue(parsed.error));

  try {
    await db.insert(galleryImages).values({
      url: parsed.data.url,
      alt: parsed.data.alt,
      caption: parsed.data.caption || null,
      category: parsed.data.category,
      storageKey: parsed.data.storageKey ?? null,
      position: parsed.data.position ?? 0,
    });
  } catch (error) {
    console.error("[mysa] addGalleryImage failed:", error);
    return fail("Could not add the photograph. Please try again.");
  }

  revalidatePublic();
  revalidatePath("/admin/gallery");
  return ok("Photograph added.");
}

export async function deleteGalleryImage(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const [row] = await db.select().from(galleryImages).where(eq(galleryImages.id, id)).limit(1);
  await db.delete(galleryImages).where(eq(galleryImages.id, id));
  // Remove the stored file too, so the blob store does not fill with orphans.
  await deleteImage(row?.storageKey);

  revalidatePublic();
  revalidatePath("/admin/gallery");
}

export async function moveGalleryImage(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const position = Number(formData.get("position") ?? 0);
  if (!id || !Number.isFinite(position)) return;

  await db
    .update(galleryImages)
    .set({ position: Math.max(0, Math.round(position)) })
    .where(eq(galleryImages.id, id));

  revalidatePublic();
  revalidatePath("/admin/gallery");
}

/* --------------------------- settings and hours -------------------------- */

export async function updateSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const d = parsed.data;

  try {
    await db
      .insert(siteSettings)
      .values({
        id: "default",
        addressLine1: d.addressLine1,
        addressLine2: d.addressLine2 || null,
        city: d.city,
        region: d.region || null,
        postalCode: d.postalCode || null,
        country: d.country,
        latitude: d.latitude || null,
        longitude: d.longitude || null,
        mapUrl: d.mapUrl || null,
        neighbourhoodNote: d.neighbourhoodNote || null,
        phone: d.phone || null,
        email: d.email,
        currency: d.currency,
        announcement: d.announcement || null,
      })
      .onConflictDoUpdate({
        target: siteSettings.id,
        set: {
          addressLine1: d.addressLine1,
          addressLine2: d.addressLine2 || null,
          city: d.city,
          region: d.region || null,
          postalCode: d.postalCode || null,
          country: d.country,
          latitude: d.latitude || null,
          longitude: d.longitude || null,
          mapUrl: d.mapUrl || null,
          neighbourhoodNote: d.neighbourhoodNote || null,
          phone: d.phone || null,
          email: d.email,
          currency: d.currency,
          announcement: d.announcement || null,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error("[mysa] updateSettings failed:", error);
    return fail("Could not save the details. Please try again.");
  }

  revalidatePublic();
  revalidatePath("/admin/hours");
  return ok("Location details saved.");
}

export async function updateHours(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const hours = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    dayOfWeek: day,
    opensAt: String(formData.get(`opensAt-${day}`) ?? "08:00"),
    closesAt: String(formData.get(`closesAt-${day}`) ?? "17:00"),
    isClosed: formData.get(`isClosed-${day}`) === "on",
    note: String(formData.get(`note-${day}`) ?? ""),
  }));

  const parsed = hoursSchema.safeParse({ hours });
  if (!parsed.success) return fail(firstIssue(parsed.error));

  for (const hour of parsed.data.hours) {
    if (!hour.isClosed && hour.closesAt <= hour.opensAt) {
      return fail(
        `Closing time must be after opening time (day ${hour.dayOfWeek}). For overnight hours, use 23:59.`
      );
    }
  }

  try {
    for (const hour of parsed.data.hours) {
      await db
        .insert(openingHours)
        .values({
          dayOfWeek: hour.dayOfWeek,
          opensAt: hour.opensAt,
          closesAt: hour.closesAt,
          isClosed: hour.isClosed,
          note: hour.note || null,
        })
        .onConflictDoUpdate({
          target: openingHours.dayOfWeek,
          set: {
            opensAt: hour.opensAt,
            closesAt: hour.closesAt,
            isClosed: hour.isClosed,
            note: hour.note || null,
          },
        });
    }
  } catch (error) {
    console.error("[mysa] updateHours failed:", error);
    return fail("Could not save the hours. Please try again.");
  }

  revalidatePublic();
  revalidatePath("/admin/hours");
  return ok("Opening hours saved.");
}

/* -------------------------------- messages ------------------------------- */

export async function setMessageStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = messageStatusSchema.safeParse({ status: String(formData.get("status") ?? "") });
  if (!id || !parsed.success) return;

  await db.update(messages).set({ status: parsed.data.status }).where(eq(messages.id, id));
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function deleteMessage(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.delete(messages).where(eq(messages.id, id));
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

/* ------------------------------ reservations ----------------------------- */

export async function setReservationStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = reservationStatusSchema.safeParse({ status: String(formData.get("status") ?? "") });
  if (!id || !parsed.success) return;

  await db.update(reservations).set({ status: parsed.data.status }).where(eq(reservations.id, id));
  revalidatePath("/admin/reservations");
  revalidatePath("/admin");
}

export async function deleteReservation(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.delete(reservations).where(eq(reservations.id, id));
  revalidatePath("/admin/reservations");
  revalidatePath("/admin");
}
