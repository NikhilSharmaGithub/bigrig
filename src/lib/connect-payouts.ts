import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, products, vendorPayouts, vendors } from "@/db/schema";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { commissionFor, getCommissionBps } from "@/lib/settings";

/**
 * After an order is paid, transfer each connected vendor's earnings
 * (their sales minus platform commission) to their Stripe Connect account,
 * and record a payout row. No-op if Stripe isn't configured. Never throws.
 */
export async function transferOrderPayouts(orderId: string): Promise<void> {
  if (!isStripeConfigured()) return;

  let bps: number;
  try {
    bps = await getCommissionBps();
  } catch {
    return;
  }

  const lines = await db
    .select({
      vendorId: products.vendorId,
      stripeAccountId: vendors.stripeAccountId,
      payoutsEnabled: vendors.payoutsEnabled,
      gross: sql<number>`COALESCE(SUM(${orderItems.lineTotalCents}), 0)::int`,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .innerJoin(vendors, eq(products.vendorId, vendors.id))
    .where(eq(orderItems.orderId, orderId))
    .groupBy(products.vendorId, vendors.stripeAccountId, vendors.payoutsEnabled);

  const stripe = getStripe();
  for (const l of lines) {
    if (!l.vendorId || !l.stripeAccountId || !l.payoutsEnabled) continue;
    const earned = l.gross - commissionFor(l.gross, bps);
    if (earned <= 0) continue;

    try {
      const transfer = await stripe.transfers.create({
        amount: earned,
        currency: "usd",
        destination: l.stripeAccountId,
        transfer_group: orderId,
      });
      await db.insert(vendorPayouts).values({
        vendorId: l.vendorId,
        amountCents: earned,
        status: "paid",
        stripeTransferId: transfer.id,
        note: `Auto payout for order ${orderId}`,
      });
    } catch (err) {
      await db.insert(vendorPayouts).values({
        vendorId: l.vendorId,
        amountCents: earned,
        status: "failed",
        note: `Transfer failed: ${(err as Error).message}`.slice(0, 200),
      });
    }
  }
}
