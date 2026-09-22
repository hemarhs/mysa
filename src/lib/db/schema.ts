import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* -------------------------------------------------------------------------- */
/* Enums                                                                      */
/* -------------------------------------------------------------------------- */

export const galleryCategoryEnum = pgEnum("gallery_category", [
  "space",
  "drinks",
  "desserts",
]);

export const messageStatusEnum = pgEnum("message_status", [
  "new",
  "read",
  "archived",
]);

export const reservationStatusEnum = pgEnum("reservation_status", [
  "pending",
  "confirmed",
  "declined",
  "cancelled",
]);

/* -------------------------------------------------------------------------- */
/* Menu                                                                       */
/* -------------------------------------------------------------------------- */

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    /** Short line shown under the category heading on the menu page. */
    description: text("description"),
    position: smallint("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("categories_slug_idx").on(t.slug)]
);

export const menuItems = pgTable(
  "menu_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description"),
    /**
     * Money is stored in minor units (cents) as an integer. Floating point
     * currency is a bug waiting to happen and numeric round-trips as a string.
     */
    priceCents: integer("price_cents").notNull(),
    imageUrl: text("image_url"),
    /** Dietary / preparation notes, e.g. ["vegan", "contains nuts"]. */
    tags: text("tags").array().notNull().default([]),
    isFeatured: boolean("is_featured").notNull().default(false),
    isSoldOut: boolean("is_sold_out").notNull().default(false),
    /** Soft-hide without deleting, so seasonal items can return. */
    isActive: boolean("is_active").notNull().default(true),
    position: smallint("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("menu_items_category_idx").on(t.categoryId),
    index("menu_items_featured_idx").on(t.isFeatured),
  ]
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  category: one(categories, {
    fields: [menuItems.categoryId],
    references: [categories.id],
  }),
}));

/* -------------------------------------------------------------------------- */
/* Gallery                                                                    */
/* -------------------------------------------------------------------------- */

export const galleryImages = pgTable(
  "gallery_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    url: text("url").notNull(),
    alt: varchar("alt", { length: 300 }).notNull(),
    caption: varchar("caption", { length: 300 }),
    category: galleryCategoryEnum("category").notNull().default("space"),
    /** Storage key, kept so deleting a row can delete the blob too. */
    storageKey: text("storage_key"),
    position: smallint("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("gallery_category_idx").on(t.category)]
);

/* -------------------------------------------------------------------------- */
/* Site settings (single row) + opening hours                                 */
/* -------------------------------------------------------------------------- */

export const siteSettings = pgTable("site_settings", {
  /** Fixed to 'default'. A single-row table keeps reads trivially cacheable. */
  id: varchar("id", { length: 16 }).primaryKey().default("default"),
  addressLine1: varchar("address_line1", { length: 160 }).notNull(),
  addressLine2: varchar("address_line2", { length: 160 }),
  city: varchar("city", { length: 120 }).notNull(),
  region: varchar("region", { length: 120 }),
  postalCode: varchar("postal_code", { length: 32 }),
  country: varchar("country", { length: 2 }).notNull().default("US"),
  latitude: varchar("latitude", { length: 32 }),
  longitude: varchar("longitude", { length: 32 }),
  mapUrl: text("map_url"),
  neighbourhoodNote: text("neighbourhood_note"),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 160 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  /** Optional banner, e.g. "Closed 24–26 December". Empty hides it. */
  announcement: text("announcement"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const openingHours = pgTable(
  "opening_hours",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** 0 = Sunday … 6 = Saturday, matching Date#getDay(). */
    dayOfWeek: smallint("day_of_week").notNull(),
    opensAt: varchar("opens_at", { length: 5 }).notNull().default("08:00"),
    closesAt: varchar("closes_at", { length: 5 }).notNull().default("17:00"),
    isClosed: boolean("is_closed").notNull().default(false),
    note: varchar("note", { length: 160 }),
  },
  (t) => [uniqueIndex("opening_hours_day_idx").on(t.dayOfWeek)]
);

/* -------------------------------------------------------------------------- */
/* Contact messages                                                           */
/* -------------------------------------------------------------------------- */

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 160 }).notNull(),
    subject: varchar("subject", { length: 200 }),
    body: text("body").notNull(),
    status: messageStatusEnum("status").notNull().default("new"),
    /**
     * Hashed, not raw. Enough to rate limit and spot abuse, without keeping
     * personal data we have no reason to hold.
     */
    ipHash: varchar("ip_hash", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_status_idx").on(t.status), index("messages_created_idx").on(t.createdAt)]
);

/* -------------------------------------------------------------------------- */
/* Reservations                                                               */
/* -------------------------------------------------------------------------- */

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 160 }).notNull(),
    phone: varchar("phone", { length: 40 }),
    partySize: smallint("party_size").notNull(),
    /** ISO date, e.g. 2026-11-14. Stored as text so no timezone can shift it. */
    date: varchar("date", { length: 10 }).notNull(),
    /** 24-hour time, e.g. 19:30. */
    time: varchar("time", { length: 5 }).notNull(),
    occasion: varchar("occasion", { length: 80 }),
    notes: text("notes"),
    status: reservationStatusEnum("status").notNull().default("pending"),
    ipHash: varchar("ip_hash", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("reservations_status_idx").on(t.status),
    index("reservations_date_idx").on(t.date),
  ]
);

/* -------------------------------------------------------------------------- */
/* Admin users                                                                */
/* -------------------------------------------------------------------------- */

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 160 }).notNull(),
    name: varchar("name", { length: 120 }),
    passwordHash: text("password_hash").notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("admin_users_email_idx").on(t.email)]
);

/* -------------------------------------------------------------------------- */
/* Inferred types                                                             */
/* -------------------------------------------------------------------------- */

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;
export type GalleryImage = typeof galleryImages.$inferSelect;
export type NewGalleryImage = typeof galleryImages.$inferInsert;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type OpeningHour = typeof openingHours.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;

export type GalleryCategory = (typeof galleryCategoryEnum.enumValues)[number];
export type MessageStatus = (typeof messageStatusEnum.enumValues)[number];
export type ReservationStatus = (typeof reservationStatusEnum.enumValues)[number];
