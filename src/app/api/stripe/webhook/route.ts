import { NextResponse, type NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db";
import { cartItems, inventory, orders } from "@/db/schema";
import { getStripe } from "@/lib/stripe";
import type { ShippingAddressSnapshot } from "@/lib/orders";
import { transferOrderPayouts } from "@/lib/connect-payouts";
import { incrementRedemption } from "@/lib/coupons";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  const signature = req.headers.get("stripe-signature");
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature ?? "",
      webhookSecret,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await fulfillOrder(session);
  }

  return NextResponse.json({ received: true });
}

async function fulfillOrder(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  const cartId = session.metadata?.cartId;
  if (!orderId) return;

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: true },
  });
  if (!order || order.status === "paid") return;

  const details = session.customer_details;
  const addr: ShippingAddressSnapshot | null = details
    ? {
        name: details.name,
        email: details.email,
        line1: details.address?.line1,
        line2: details.address?.line2,
        city: details.address?.city,
        state: details.address?.state,
        postalCode: details.address?.postal_code,
        country: details.address?.country,
      }
    : null;

  await db
    .update(orders)
    .set({
      status: "paid",
      email: order.email || details?.email || "",
      stripePaymentIntent:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : null,
      shippingAddress: addr,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  // Decrement stock for each purchased line.
  for (const item of order.items) {
    if (!item.productId) continue;
    await db
      .update(inventory)
      .set({
        quantity: sql`GREATEST(0, ${inventory.quantity} - ${item.quantity})`,
        updatedAt: new Date(),
      })
      .where(eq(inventory.productId, item.productId));
  }

  // Empty the cart that produced this order.
  if (cartId) {
    await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  }

  // Count the coupon redemption.
  if (order.couponCode) {
    try {
      await incrementRedemption(order.couponCode);
    } catch {
      // Non-critical.
    }
  }

  // Send the order confirmation email (no-op if email isn't configured).
  void sendOrderConfirmationEmail({
    orderNumber: order.orderNumber,
    email: order.email || details?.email || "",
    items: order.items.map((it) => ({
      name: it.name,
      quantity: it.quantity,
      lineTotalCents: it.lineTotalCents,
    })),
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
  });

  // Pay out each connected vendor their share (best-effort — never blocks).
  try {
    await transferOrderPayouts(orderId);
  } catch {
    // Payout failures are recorded per-vendor; don't fail the webhook.
  }
}
