"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quoteItems, quotes } from "@/db/schema";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { sendQuoteReadyEmail, sendQuoteRequestedEmails } from "@/lib/email";
import {
  QUOTE_VALID_DAYS,
  createQuoteFromCart,
  getQuoteByCode,
  getQuoteById,
  normalizeQuoteCode,
} from "@/lib/quotes";

export type QuoteFormState = { error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Cart → quote request. Sends the shopper to their quote page (which shows the code). */
export async function requestQuoteAction(
  _prev: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  const user = await getCurrentUser();
  const email = String(formData.get("email") ?? user?.email ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim().slice(0, 80) || user?.name || null;
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000) || null;
  if (!EMAIL_RE.test(email)) return { error: "Enter an email so we can send you the price." };

  const result = await createQuoteFromCart({ userId: user?.id ?? null, name, email, note });
  if ("error" in result) return { error: result.error };

  const quote = await getQuoteByCode(result.code);
  if (quote) {
    void sendQuoteRequestedEmails({
      code: quote.code,
      email: quote.email,
      name: quote.name,
      itemCount: quote.items.length,
      listTotalCents: quote.listTotalCents,
      note: quote.note,
    });
  }
  revalidatePath("/admin/quotes");
  redirect(`/quote/${result.code}?new=1`);
}

/** "Have a quote code?" lookup for shoppers. */
export async function lookupQuoteAction(
  _prev: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  const raw = String(formData.get("code") ?? "");
  if (!raw.trim()) return { error: "Enter your quote code." };
  const quote = await getQuoteByCode(raw);
  if (!quote) return { error: "We couldn't find that code. Check it and try again." };
  redirect(`/quote/${quote.code}`);
}

/** Admin: open a quote by the code the customer sent. */
export async function adminFindQuoteAction(
  _prev: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  await requireAdmin();
  const raw = String(formData.get("code") ?? "");
  if (!raw.trim()) return { error: "Enter a quote code." };
  const quote = await getQuoteByCode(raw);
  if (!quote) return { error: `No quote with code ${normalizeQuoteCode(raw)}.` };
  redirect(`/admin/quotes/${quote.id}`);
}

/**
 * Admin: save the store's price per line (field "price_<itemId>", dollars) and
 * send the quote. Lines left blank keep their list price.
 */
export async function adminSendQuoteAction(
  quoteId: string,
  _prev: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  await requireAdmin();
  const quote = await getQuoteById(quoteId);
  if (!quote) return { error: "Quote not found." };
  if (quote.status === "accepted" || quote.status === "cancelled") {
    return { error: `This quote is already ${quote.status}.` };
  }

  let total = 0;
  const updates: { id: string; cents: number }[] = [];
  for (const item of quote.items) {
    const raw = String(formData.get(`price_${item.id}`) ?? "").trim();
    const cents = raw === "" ? item.unitPriceCents : Math.round(Number(raw.replace(/[^0-9.]/g, "")) * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      return { error: `Enter a valid price for ${item.name}.` };
    }
    updates.push({ id: item.id, cents });
    total += cents * item.quantity;
  }

  const days = Math.min(90, Math.max(1, Math.floor(Number(formData.get("validDays")) || QUOTE_VALID_DAYS)));
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const adminNote = String(formData.get("adminNote") ?? "").trim().slice(0, 1000) || null;

  for (const u of updates) {
    await db.update(quoteItems).set({ quotedUnitCents: u.cents }).where(eq(quoteItems.id, u.id));
  }
  await db
    .update(quotes)
    .set({
      status: "quoted",
      quotedTotalCents: total,
      quotedAt: new Date(),
      expiresAt,
      adminNote,
    })
    .where(eq(quotes.id, quoteId));

  void sendQuoteReadyEmail({
    code: quote.code,
    email: quote.email,
    quotedTotalCents: total,
    listTotalCents: quote.listTotalCents,
    expiresAt,
  });
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath(`/quote/${quote.code}`);
  redirect(`/admin/quotes/${quoteId}?sent=1`);
}

export async function adminCancelQuoteAction(quoteId: string): Promise<void> {
  await requireAdmin();
  const quote = await getQuoteById(quoteId);
  if (!quote || quote.status === "accepted") return;
  await db.update(quotes).set({ status: "cancelled" }).where(eq(quotes.id, quoteId));
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath(`/quote/${quote.code}`);
}
