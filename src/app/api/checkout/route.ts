import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { getCartDiscount } from "@/lib/coupons";
import { generateOrderNumber } from "@/lib/orders";
import { getStoreSettings, shippingFor, taxFor } from "@/lib/settings";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Payments aren't configured yet. Add STRIPE_SECRET_KEY." },
      { status: 503 },
    );
  }

  const cart = await getCart();
  if (cart.items.length === 0 || !cart.id) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const user = await getCurrentUser();
  const settings = await getStoreSettings();
  const subtotal = cart.subtotalCents;
  const shipping = shippingFor(subtotal, settings);
  const couponResult = await getCartDiscount(subtotal);
  const discountCents = couponResult?.ok ? couponResult.discountCents : 0;
  const couponCode = couponResult?.ok ? couponResult.code : null;
  const taxCents = taxFor(Math.max(0, subtotal - discountCents), settings.taxBps);
  const total = subtotal - discountCents + shipping + taxCents;
  const orderNumber = generateOrderNumber();

  // Create the order in 'pending'; the webhook flips it to 'paid'.
  const [order] = await db
    .insert(orders)
    .values({
      orderNumber,
      userId: user?.id ?? null,
      email: user?.email ?? "",
      status: "pending",
      subtotalCents: subtotal,
      discountCents,
      couponCode,
      shippingCents: shipping,
      taxCents,
      totalCents: total,
    })
    .returning();

  await db.insert(orderItems).values(
    cart.items.map((i) => ({
      orderId: order.id,
      productId: i.productId,
      name: i.name,
      partNumber: i.partNumber,
      unitPriceCents: i.unitPriceCents,
      quantity: i.quantity,
      lineTotalCents: i.lineTotalCents,
    })),
  );

  const stripe = getStripe();
  const hdrs = await headers();
  const origin =
    hdrs.get("origin") ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "http://localhost:3000";

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
    cart.items.map((i) => ({
      quantity: i.quantity,
      price_data: {
        currency: "usd",
        unit_amount: i.unitPriceCents,
        product_data: {
          name: i.name,
          description: `Part #${i.partNumber}`,
        },
      },
    }));

  if (taxCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: taxCents,
        product_data: { name: "Estimated sales tax" },
      },
    });
  }

  // Apply the coupon as a one-off Stripe discount.
  let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
  if (discountCents > 0 && couponCode) {
    const stripeCoupon = await stripe.coupons.create({
      amount_off: discountCents,
      currency: "usd",
      duration: "once",
      name: couponCode,
    });
    discounts = [{ coupon: stripeCoupon.id }];
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    ...(discounts ? { discounts } : {}),
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
    customer_email: user?.email || undefined,
    metadata: {
      orderId: order.id,
      orderNumber,
      cartId: cart.id,
    },
    success_url: `${origin}/checkout/success?order=${orderNumber}`,
    cancel_url: `${origin}/cart`,
  });

  await db
    .update(orders)
    .set({ stripeSessionId: session.id })
    .where(eq(orders.id, order.id));

  return NextResponse.json({ url: session.url });
}
