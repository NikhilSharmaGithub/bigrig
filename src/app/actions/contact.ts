"use server";

import { db } from "@/db";
import { contactMessages } from "@/db/schema";

export type ContactState = { ok?: boolean; error?: string };

export async function submitContactAction(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { error: "Name, email, and message are required." };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  try {
    await db.insert(contactMessages).values({
      name,
      email,
      subject: subject || null,
      message,
    });
  } catch {
    return { error: "Couldn't send your message right now. Please try again." };
  }

  return { ok: true };
}
