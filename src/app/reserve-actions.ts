"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { reservations } from "@/lib/db/schema";
import { clientIp, hashIp, pruneRateLimits, rateLimit } from "@/lib/rate-limit";
import { reservationSchema } from "@/lib/validation";

export type ReservationState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Echoed back so the confirmation panel can restate the booking. */
  booking?: { name: string; date: string; time: string; partySize: number };
};

/** Two months out is as far as we take bookings. */
const MAX_DAYS_AHEAD = 60;

export async function submitReservation(
  _prev: ReservationState,
  formData: FormData
): Promise<ReservationState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    partySize: String(formData.get("partySize") ?? ""),
    date: String(formData.get("date") ?? ""),
    time: String(formData.get("time") ?? ""),
    occasion: String(formData.get("occasion") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    company: String(formData.get("company") ?? ""),
  };

  // Honeypot: report success and write nothing.
  if (raw.company) {
    return { status: "success", message: "Thank you — we will confirm by email shortly." };
  }

  const parsed = reservationSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", message: "Please check the details below.", fieldErrors };
  }

  const data = parsed.data;

  // Date sanity, checked on the server — a disabled input in the browser is
  // a courtesy, not a control.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const requested = new Date(`${data.date}T00:00:00`);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + MAX_DAYS_AHEAD);

  if (requested < today) {
    return { status: "error", message: "That date has passed.", fieldErrors: { date: "Choose a date from today onwards." } };
  }
  if (requested > horizon) {
    return {
      status: "error",
      message: "That is further ahead than we take bookings.",
      fieldErrors: { date: `We take bookings up to ${MAX_DAYS_AHEAD} days ahead.` },
    };
  }

  const ip = clientIp(await headers());
  pruneRateLimits();

  const limit = rateLimit(`reserve:${ip}`, 4, 30 * 60 * 1000);
  if (!limit.ok) {
    return {
      status: "error",
      message: `That is several requests in a short time. Try again in about ${Math.ceil(
        limit.retryAfter / 60
      )} minutes, or email hello@mysa.cafe.`,
    };
  }

  try {
    await db.insert(reservations).values({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      partySize: data.partySize,
      date: data.date,
      time: data.time,
      occasion: data.occasion || null,
      notes: data.notes || null,
      ipHash: ip === "unknown" ? null : hashIp(ip),
    });
  } catch (error) {
    console.error("[mysa] failed to store reservation:", error);
    return {
      status: "error",
      message:
        "Something went wrong at our end and the request did not send. Please email hello@mysa.cafe and we will sort it out.",
    };
  }

  revalidatePath("/admin/reservations");
  revalidatePath("/admin");

  return {
    status: "success",
    message: "We have your request and will confirm by email within a few hours.",
    booking: { name: data.name, date: data.date, time: data.time, partySize: data.partySize },
  };
}
