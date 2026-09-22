"use server";

import { headers } from "next/headers";

import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { clientIp, hashIp, pruneRateLimits, rateLimit } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/validation";

export type ContactState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export async function submitContact(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    subject: String(formData.get("subject") ?? ""),
    message: String(formData.get("message") ?? ""),
    company: String(formData.get("company") ?? ""),
  };

  // Honeypot: a filled "company" field means a bot. Return success so the bot
  // has nothing to learn, and write nothing.
  if (raw.company) {
    return { status: "success", message: "Thank you — we will write back shortly." };
  }

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", message: "Please check the form below.", fieldErrors };
  }

  const headerList = await headers();
  const ip = clientIp(headerList);

  pruneRateLimits();
  const limit = rateLimit(`contact:${ip}`, 3, 10 * 60 * 1000);
  if (!limit.ok) {
    return {
      status: "error",
      message: `That is a few messages in a short time. Try again in about ${Math.ceil(
        limit.retryAfter / 60
      )} minutes, or email us directly.`,
    };
  }

  try {
    await db.insert(messages).values({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject || null,
      body: parsed.data.message,
      ipHash: ip === "unknown" ? null : hashIp(ip),
    });
  } catch (error) {
    console.error("[mysa] failed to store contact message:", error);
    return {
      status: "error",
      message:
        "Something went wrong at our end and the message did not send. Please email us directly at hello@mysa.cafe.",
    };
  }

  return {
    status: "success",
    message: "Thank you — your message is with us. We usually reply within a day.",
  };
}
