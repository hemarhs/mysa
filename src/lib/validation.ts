import { z } from "zod";

/** Shared input schemas. Every API route parses with one of these. */

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name.").max(120),
  email: z.string().trim().toLowerCase().email("That does not look like an email address."),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "A little more detail, if you would.")
    .max(4000, "That is longer than we can accept — please trim it down."),
  /** Honeypot. Real people never fill this in; bots usually do. */
  company: z.string().max(0, "Rejected.").optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const menuItemSchema = z.object({
  categoryId: z.string().uuid("Choose a category."),
  name: z.string().trim().min(2, "Give the item a name.").max(160),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  /** Accepts "6.25" from the form and converts to minor units. */
  price: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "number" ? v : Number(v.replace(/[^0-9.]/g, ""))))
    .refine((v) => Number.isFinite(v) && v >= 0, "Enter a valid price.")
    .refine((v) => v < 10000, "That price looks wrong.")
    .transform((v) => Math.round(v * 100)),
  imageUrl: z.string().trim().url("Enter a valid image URL.").optional().or(z.literal("")),
  tags: z.array(z.string().trim().max(40)).max(8).optional(),
  isFeatured: z.coerce.boolean().optional(),
  isSoldOut: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  position: z.coerce.number().int().min(0).max(999).optional(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Give the category a name.").max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only.")
    .max(64),
  description: z.string().trim().max(400).optional().or(z.literal("")),
  position: z.coerce.number().int().min(0).max(99).optional(),
});

export const galleryImageSchema = z.object({
  url: z.string().trim().url("Enter a valid image URL."),
  alt: z.string().trim().min(3, "Describe the image for screen readers.").max(300),
  caption: z.string().trim().max(300).optional().or(z.literal("")),
  category: z.enum(["space", "drinks", "desserts"]),
  storageKey: z.string().optional(),
  position: z.coerce.number().int().min(0).max(999).optional(),
});

export const settingsSchema = z.object({
  addressLine1: z.string().trim().min(2).max(160),
  addressLine2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(1).max(120),
  region: z.string().trim().max(120).optional().or(z.literal("")),
  postalCode: z.string().trim().max(32).optional().or(z.literal("")),
  country: z.string().trim().length(2).toUpperCase(),
  latitude: z.string().trim().max(32).optional().or(z.literal("")),
  longitude: z.string().trim().max(32).optional().or(z.literal("")),
  mapUrl: z.string().trim().url().optional().or(z.literal("")),
  neighbourhoodNote: z.string().trim().max(400).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().toLowerCase().email(),
  currency: z.string().trim().length(3).toUpperCase(),
  announcement: z.string().trim().max(300).optional().or(z.literal("")),
});

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour time, e.g. 08:30.");

export const hoursSchema = z.object({
  hours: z
    .array(
      z.object({
        dayOfWeek: z.coerce.number().int().min(0).max(6),
        opensAt: timeString,
        closesAt: timeString,
        isClosed: z.coerce.boolean(),
        note: z.string().trim().max(160).optional().or(z.literal("")),
      })
    )
    .length(7, "All seven days are required."),
});

export const messageStatusSchema = z.object({
  status: z.enum(["new", "read", "archived"]),
});

/* ------------------------------ reservations ----------------------------- */

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.")
  .refine((value) => !Number.isNaN(Date.parse(value)), "That date is not valid.");

export const reservationSchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name.").max(160),
  email: z.string().trim().toLowerCase().email("That does not look like an email address."),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  partySize: z.coerce
    .number()
    .int("Whole people only.")
    .min(1, "At least one of you.")
    .max(20, "For more than twenty, email us and we will arrange it properly."),
  date: isoDate,
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a time."),
  occasion: z.string().trim().max(80).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  /** Honeypot. */
  company: z.string().max(0, "Rejected.").optional().or(z.literal("")),
});

export const reservationStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "declined", "cancelled"]),
});

export type ReservationInput = z.infer<typeof reservationSchema>;

export type ContactInput = z.infer<typeof contactSchema>;
export type MenuItemInput = z.infer<typeof menuItemSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
