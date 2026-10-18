import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db";
import { orderItems, orders, quotes } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/orders";
import { effectiveStatus, getQuoteByCode } from "@/lib/quotes";
import { getStoreSettings, shippingFor, taxFor } from "@/lib/settings";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

/** Accept a quote: an order at the quoted prices, paid through Stripe Checkout. */
export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Online payment isn't set up yet. Email us your quote code to order." },
      { status: 503 },
    );
  }

  const { code } = (await req.json().catch(() => ({}))) as { code?: string };
  const quote = code ? await getQuoteByCode(code) : null;
  if (!quote) return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  const status = effectiveStatus(quote);
  if (status !== "quoted") {
    const why: Record<string, string> = {
      requested: "We haven't priced this quote yet.",
      expired: "This quote has expired. Ask us for a fresh price.",
      accepted: "This quote has already been paid.",
      cancelled: "This quote was cancelled.",
    };
    return NextResponse.json({ error: why[status] ?? "This quote can't be checked out." }, { status: 409 });
  }

  const user = await getCurrentUser();
  const settings = await getStoreSettings();
  const lines = quote.items.map((i) => {
    const unit = i.quotedUnitCents ?? i.unitPriceCents;
    return { ...i, unit, lineTotal: unit * i.quantity };
  });
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const shipping = shippingFor(subtotal, settings);
  const taxCents = taxFor(subtotal, settings.taxBps);
  const orderNumber = generateOrderNumber();

  // Pending until the webhook confirms payment (same as cart checkout).
  const [order] = await db
    .insert(orders)
    .values({
      orderNumber,
      userId: user?.id ?? quote.userId ?? null,
      email: quote.email,
      status: "pending",
      subtotalCents: subtotal,
      discountCents: 0,
      shippingCents: shipping,
      taxCents,
      totalCents: subtotal + shipping + taxCents,
    })
    .returning();

  await db.insert(orderItems).values(
    lines.map((l) => ({
      orderId: order.id,
      productId: l.productId,
      name: l.name,
      partNumber: l.partNumber,
      unitPriceCents: l.unit,
      quantity: l.quantity,
      lineTotalCents: l.lineTotal,
    })),
  );

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = lines.map((l) => ({
    quantity: l.quantity,
    price_data: {
      currency: "usd",
      unit_amount: l.unit,
      product_data: { name: l.name, description: `Part #${l.partNumber} · Quote ${quote.code}` },
    },
  }));
  if (taxCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: { currency: "usd", unit_amount: taxCents, product_data: { name: "Estimated sales tax" } },
    });
  }

  const origin =
    (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    shipping_address_collection: { allowed_countries: ["US"] },
    ...(shipping > 0
      ? {
          shipping_options: [
            {
              shipping_rate_data: {
                type: "fixed_amount",
                fixed_amount: { amount: shipping, currency: "usd" },
                display_name: "Standard Shipping",
              },
            },
          ],
        }
      : {}),
    customer_email: quote.email,
    metadata: { orderId: order.id, orderNumber, quoteId: quote.id },
    success_url: `${origin}/checkout/success?order=${orderNumber}`,
    cancel_url: `${origin}/quote/${quote.code}`,
  });

  await db.update(orders).set({ stripeSessionId: session.id }).where(eq(orders.id, order.id));
  await db.update(quotes).set({ orderId: order.id }).where(eq(quotes.id, quote.id));

  return NextResponse.json({ url: session.url });
}
