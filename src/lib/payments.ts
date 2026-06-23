import "server-only";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products, vendors } from "@/db/schema";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

/** Statuses that represent money actually collected. */
const PAID_STATUSES = ["paid", "processing", "shipped", "delivered"] as const;

export async function getRevenueSummary() {
  const [gross] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${orders.totalCents}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(inArray(orders.status, [...PAID_STATUSES]));

  const [refunded] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${orders.totalCents}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(eq(orders.status, "refunded"));

  const [pending] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(eq(orders.status, "pending"));

  const grossCents = gross?.total ?? 0;
  const paidOrders = gross?.count ?? 0;
  const refundedCents = refunded?.total ?? 0;

  return {
    grossCents,
    netCents: grossCents - refundedCents,
    refundedCents,
    paidOrders,
    refundedOrders: refunded?.count ?? 0,
    pendingOrders: pending?.count ?? 0,
    avgOrderCents: paidOrders > 0 ? Math.round(grossCents / paidOrders) : 0,
  };
}

export type VendorSales = {
  vendorId: string | null;
  name: string;
  slug: string | null;
  units: number;
  revenueCents: number;
};

export async function getSalesByVendor(): Promise<VendorSales[]> {
  const rows = await db
    .select({
      vendorId: products.vendorId,
      storeName: vendors.storeName,
      slug: vendors.slug,
      units: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)::int`,
      revenue: sql<number>`COALESCE(SUM(${orderItems.lineTotalCents}), 0)::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .leftJoin(products, eq(orderItems.productId, products.id))
    .leftJoin(vendors, eq(products.vendorId, vendors.id))
    .where(inArray(orders.status, [...PAID_STATUSES]))
    .groupBy(products.vendorId, vendors.storeName, vendors.slug)
    .orderBy(desc(sql`SUM(${orderItems.lineTotalCents})`));

  return rows.map((r) => ({
    vendorId: r.vendorId,
    name: r.storeName ?? "Big Rig Components (House)",
    slug: r.slug,
    units: r.units,
    revenueCents: r.revenue,
  }));
}

export async function getRecentPayments(limit = 25) {
  return db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      email: orders.email,
      status: orders.status,
      totalCents: orders.totalCents,
      paymentIntent: orders.stripePaymentIntent,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(inArray(orders.status, [...PAID_STATUSES, "refunded"]))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

/** Live Stripe balance — null when Stripe isn't configured or unreachable. */
export async function getStripeBalance() {
  if (!isStripeConfigured()) return null;
  try {
    const stripe = getStripe();
    const balance = await stripe.balance.retrieve();
    const sum = (arr: { amount: number }[]) =>
      arr.reduce((s, b) => s + b.amount, 0);
    return {
      availableCents: sum(balance.available),
      pendingCents: sum(balance.pending),
      currency: balance.available[0]?.currency ?? "usd",
    };
  } catch {
    return null;
  }
}
