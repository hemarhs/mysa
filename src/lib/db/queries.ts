import "server-only";

import { and, asc, desc, eq, gte, ne, sql } from "drizzle-orm";

import { DEFAULT_HOURS, DEFAULT_LOCATION, SITE } from "@/lib/site";
import { db } from "./index";
import {
  categories,
  galleryImages,
  menuItems,
  messages,
  openingHours,
  reservations,
  siteSettings,
  type GalleryCategory,
  type MenuItem,
  type ReservationStatus,
} from "./schema";

/**
 * Public-facing reads degrade instead of throwing.
 *
 * A marketing page should not 500 — or fail a production build — because the
 * database was briefly unreachable. Failures are logged loudly and the page
 * renders with whatever safe default makes sense. Admin reads below do NOT use
 * this: there, a failure must surface.
 */
async function safe<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    console.error(`[mysa] ${label} failed, serving fallback:`, error);
    return fallback;
  }
}

export type MenuCategoryWithItems = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  items: MenuItem[];
};

/** Full menu, grouped by category, active items only. Used by /menu. */
export async function getMenu(): Promise<MenuCategoryWithItems[]> {
  return safe("menu lookup", async () => {
  const rows = await db
    .select({
      categoryId: categories.id,
      slug: categories.slug,
      categoryName: categories.name,
      categoryDescription: categories.description,
      categoryPosition: categories.position,
      item: menuItems,
    })
    .from(categories)
    .leftJoin(
      menuItems,
      and(eq(menuItems.categoryId, categories.id), eq(menuItems.isActive, true))
    )
    .orderBy(asc(categories.position), asc(menuItems.position), asc(menuItems.name));

  const grouped = new Map<string, MenuCategoryWithItems>();

  for (const row of rows) {
    let entry = grouped.get(row.categoryId);
    if (!entry) {
      entry = {
        id: row.categoryId,
        slug: row.slug,
        name: row.categoryName,
        description: row.categoryDescription,
        items: [],
      };
      grouped.set(row.categoryId, entry);
    }
    if (row.item) entry.items.push(row.item);
  }

  return [...grouped.values()];
  }, []);
}

/** The three items shown on the home page. */
export async function getFeaturedItems(limit = 3) {
  return safe("featured items lookup", () => db
    .select({
      item: menuItems,
      categoryName: categories.name,
    })
    .from(menuItems)
    .innerJoin(categories, eq(menuItems.categoryId, categories.id))
    .where(and(eq(menuItems.isFeatured, true), eq(menuItems.isActive, true)))
    .orderBy(asc(menuItems.position))
    .limit(limit), []);
}

export async function getCategories() {
  return safe(
    "categories lookup",
    () => db.select().from(categories).orderBy(asc(categories.position)),
    []
  );
}

/** Admin list: every item, including hidden ones, with its category name. */
export async function getAllMenuItems() {
  return db
    .select({ item: menuItems, categoryName: categories.name, categorySlug: categories.slug })
    .from(menuItems)
    .innerJoin(categories, eq(menuItems.categoryId, categories.id))
    .orderBy(asc(categories.position), asc(menuItems.position));
}

export async function getGallery(category?: GalleryCategory) {
  return safe(
    "gallery lookup",
    () => {
      const query = db.select().from(galleryImages);
      return category
        ? query.where(eq(galleryImages.category, category)).orderBy(asc(galleryImages.position))
        : query.orderBy(asc(galleryImages.position));
    },
    []
  );
}

export type Settings = typeof siteSettings.$inferSelect;
export type Hours = {
  id: string;
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
  note: string | null;
};

const FALLBACK_SETTINGS: Settings = {
  id: "default",
  addressLine1: DEFAULT_LOCATION.addressLine1,
  addressLine2: DEFAULT_LOCATION.addressLine2,
  city: DEFAULT_LOCATION.city,
  region: DEFAULT_LOCATION.region,
  postalCode: DEFAULT_LOCATION.postalCode,
  country: DEFAULT_LOCATION.country,
  latitude: DEFAULT_LOCATION.latitude,
  longitude: DEFAULT_LOCATION.longitude,
  mapUrl: DEFAULT_LOCATION.mapUrl,
  neighbourhoodNote: DEFAULT_LOCATION.neighbourhoodNote,
  phone: SITE.phone,
  email: SITE.email,
  currency: "USD",
  announcement: null,
  updatedAt: new Date(0),
};

const FALLBACK_HOURS: Hours[] = DEFAULT_HOURS.map((h) => ({
  id: `default-${h.day}`,
  dayOfWeek: h.day,
  opensAt: h.opensAt,
  closesAt: h.closesAt,
  isClosed: h.closed,
  note: null,
}));

/**
 * Settings and hours fall back to the constants in site.ts. A marketing page
 * should still show its address if the database is briefly unreachable — a
 * blank footer is worse than a slightly stale one.
 */
export async function getSettings(): Promise<Settings> {
  return safe(
    "settings lookup",
    async () => {
      const [row] = await db.select().from(siteSettings).limit(1);
      return row ?? FALLBACK_SETTINGS;
    },
    FALLBACK_SETTINGS
  );
}

export async function getHours(): Promise<Hours[]> {
  return safe(
    "hours lookup",
    async () => {
      const rows = await db.select().from(openingHours).orderBy(asc(openingHours.dayOfWeek));
      return rows.length ? rows : FALLBACK_HOURS;
    },
    FALLBACK_HOURS
  );
}

/* ------------------------------ admin reads ------------------------------ */

export async function getMessages(status?: "new" | "read" | "archived") {
  const query = db.select().from(messages);
  return status
    ? query.where(eq(messages.status, status)).orderBy(desc(messages.createdAt))
    : query.orderBy(desc(messages.createdAt));
}

export async function getReservations(status?: ReservationStatus) {
  const query = db.select().from(reservations);
  return status
    ? query.where(eq(reservations.status, status)).orderBy(asc(reservations.date), asc(reservations.time))
    : query.orderBy(asc(reservations.date), asc(reservations.time));
}

/** Upcoming confirmed and pending bookings, for the overview page. */
export async function getUpcomingReservations(limit = 6) {
  const today = new Date().toISOString().slice(0, 10);
  return db
    .select()
    .from(reservations)
    .where(and(gte(reservations.date, today), ne(reservations.status, "cancelled")))
    .orderBy(asc(reservations.date), asc(reservations.time))
    .limit(limit);
}

export async function getDashboardStats() {
  const [[items], [featured], [soldOut], [photos], [unread], [pending]] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(menuItems).where(eq(menuItems.isActive, true)),
    db.select({ count: sql<number>`count(*)::int` }).from(menuItems).where(eq(menuItems.isFeatured, true)),
    db.select({ count: sql<number>`count(*)::int` }).from(menuItems).where(eq(menuItems.isSoldOut, true)),
    db.select({ count: sql<number>`count(*)::int` }).from(galleryImages),
    db.select({ count: sql<number>`count(*)::int` }).from(messages).where(eq(messages.status, "new")),
    db.select({ count: sql<number>`count(*)::int` }).from(reservations).where(eq(reservations.status, "pending")),
  ]);

  return {
    activeItems: items?.count ?? 0,
    featuredItems: featured?.count ?? 0,
    soldOutItems: soldOut?.count ?? 0,
    galleryImages: photos?.count ?? 0,
    unreadMessages: unread?.count ?? 0,
    pendingReservations: pending?.count ?? 0,
  };
}
