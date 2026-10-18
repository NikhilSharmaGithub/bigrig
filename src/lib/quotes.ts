import "server-only";
import { randomInt } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, quoteItems, quotes } from "@/db/schema";
import { getCart } from "@/lib/cart";
import { primaryImageSql } from "@/lib/queries";

// No 0/O, 1/I/L: codes get read out over email and typed back in.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const QUOTE_VALID_DAYS = 7;

export function generateQuoteCode(): string {
  let code = "Q-";
  for (let i = 0; i < 6; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

/** "q7kd3mp", "Q 7KD 3MP", "q-7kd3mp" → "Q-7KD3MP". */
export function normalizeQuoteCode(raw: string): string {
  const body = raw.toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/^Q/, "");
  return `Q-${body}`;
}

export type QuoteState = "requested" | "quoted" | "expired" | "accepted" | "cancelled";

/** The status a shopper sees: a quoted price past its expiry reads as expired. */
export function effectiveStatus(q: { status: QuoteState | string; expiresAt: Date | null }): QuoteState {
  if (q.status === "quoted" && q.expiresAt && q.expiresAt.getTime() < Date.now()) return "expired";
  return q.status as QuoteState;
}

/** Turns the current cart into a quote request. The cart itself is left as is. */
export async function createQuoteFromCart(input: {
  userId: string | null;
  name: string | null;
  email: string;
  note: string | null;
}): Promise<{ code: string } | { error: string }> {
  const cart = await getCart();
  if (cart.items.length === 0) return { error: "Your cart is empty." };

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateQuoteCode();
    try {
      const [quote] = await db
        .insert(quotes)
        .values({
          code,
          userId: input.userId,
          name: input.name,
          email: input.email,
          note: input.note,
          listTotalCents: cart.subtotalCents,
        })
        .returning({ id: quotes.id });
      await db.insert(quoteItems).values(
        cart.items.map((i) => ({
          quoteId: quote.id,
          productId: i.productId,
          name: i.name,
          partNumber: i.partNumber,
          quantity: i.quantity,
          unitPriceCents: i.unitPriceCents,
        })),
      );
      return { code };
    } catch (err) {
      // Unique-code collision: try a fresh code; anything else is a real failure.
      if (!String((err as Error).message).includes("quotes_code_unique")) throw err;
    }
  }
  return { error: "Couldn't create a quote code. Please try again." };
}

async function quoteWithItems(where: ReturnType<typeof eq>) {
  const quote = await db.query.quotes.findFirst({ where });
  if (!quote) return null;
  const items = await db
    .select({
      id: quoteItems.id,
      productId: quoteItems.productId,
      name: quoteItems.name,
      partNumber: quoteItems.partNumber,
      quantity: quoteItems.quantity,
      unitPriceCents: quoteItems.unitPriceCents,
      quotedUnitCents: quoteItems.quotedUnitCents,
      slug: products.slug,
      imageUrl: primaryImageSql,
    })
    .from(quoteItems)
    .leftJoin(products, eq(quoteItems.productId, products.id))
    .where(eq(quoteItems.quoteId, quote.id))
    .orderBy(quoteItems.name);
  return { ...quote, items };
}

export type QuoteDetail = NonNullable<Awaited<ReturnType<typeof quoteWithItems>>>;

export function getQuoteByCode(code: string) {
  return quoteWithItems(eq(quotes.code, normalizeQuoteCode(code)));
}

export function getQuoteById(id: string) {
  return quoteWithItems(eq(quotes.id, id));
}

export async function listRecentQuotes(limit = 100) {
  return db
    .select({
      id: quotes.id,
      code: quotes.code,
      name: quotes.name,
      email: quotes.email,
      status: quotes.status,
      expiresAt: quotes.expiresAt,
      listTotalCents: quotes.listTotalCents,
      quotedTotalCents: quotes.quotedTotalCents,
      createdAt: quotes.createdAt,
      itemCount: sql<number>`(SELECT COUNT(*)::int FROM ${quoteItems} qi WHERE qi.quote_id = "quotes"."id")`,
    })
    .from(quotes)
    .orderBy(desc(quotes.createdAt))
    .limit(limit);
}
