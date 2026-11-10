import "server-only";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  contactMessages,
  inventory,
  orderItems,
  orders,
  products,
  users,
  vendors,
} from "@/db/schema";
import { getRevenueSummary } from "@/lib/payments";
import { getPayoutOverview } from "@/lib/payouts";

const PAID_STATUSES = ["paid", "processing", "shipped", "delivered"] as const;

async function scalar(query: Promise<{ n: number }[]>): Promise<number> {
  const rows = await query;
  return rows[0]?.n ?? 0;
}

export async function getDashboardData() {
  // Revenue per day for the last 14 days (zero-filled).
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - 13);

  // All dashboard queries are independent, so run them in one parallel batch
  // instead of ~15 sequential database round trips (which could exceed the
  // serverless function time limit on a slow connection).
  const [
    summary,
    payout,
    [productCount, vendorCount, customerCount, unreadMessages, lowStockCount, newCustomers30d],
    dayRows,
    ordersByStatus,
    topProducts,
    lowStock,
    recentOrders,
  ] = await Promise.all([
    getRevenueSummary(),
    getPayoutOverview(),
    Promise.all([
      scalar(db.select({ n: sql<number>`count(*)::int` }).from(products).where(sql`${products.deletedAt} IS NULL`)),
      scalar(db.select({ n: sql<number>`count(*)::int` }).from(vendors)),
      scalar(db.select({ n: sql<number>`count(*)::int` }).from(users)),
      scalar(
        db
          .select({ n: sql<number>`count(*)::int` })
          .from(contactMessages)
          .where(eq(contactMessages.isRead, false)),
      ),
      scalar(
        db
          .select({ n: sql<number>`count(*)::int` })
          .from(inventory)
          .innerJoin(products, eq(inventory.productId, products.id))
          .where(sql`${inventory.quantity} < 10 AND ${products.deletedAt} IS NULL`),
      ),
      scalar(
        db
          .select({ n: sql<number>`count(*)::int` })
          .from(users)
          .where(gte(users.createdAt, sql`now() - interval '30 days'`)),
      ),
    ]),
    db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
      total: sql<number>`COALESCE(SUM(${orders.totalCents}), 0)::int`,
    })
    .from(orders)
    .where(
      and(inArray(orders.status, [...PAID_STATUSES]), gte(orders.createdAt, since)),
    )
    .groupBy(sql`date_trunc('day', ${orders.createdAt})`),
    db
    .select({ status: orders.status, n: sql<number>`count(*)::int` })
    .from(orders)
    .groupBy(orders.status),
    db
    .select({
      name: orderItems.name,
      partNumber: orderItems.partNumber,
      units: sql<number>`SUM(${orderItems.quantity})::int`,
      revenue: sql<number>`SUM(${orderItems.lineTotalCents})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(inArray(orders.status, [...PAID_STATUSES]))
    .groupBy(orderItems.name, orderItems.partNumber)
    .orderBy(desc(sql`SUM(${orderItems.lineTotalCents})`))
    .limit(5),
    db
    .select({
      name: products.name,
      slug: products.slug,
      qty: inventory.quantity,
    })
    .from(products)
    .innerJoin(inventory, eq(inventory.productId, products.id))
    .where(sql`${inventory.quantity} < 10 AND ${products.deletedAt} IS NULL`)
    .orderBy(inventory.quantity)
    .limit(8),
    db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      email: orders.email,
      status: orders.status,
      totalCents: orders.totalCents,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(6),
  ]);
  const dayMap = new Map(dayRows.map((r) => [r.day, r.total]));
  const revenueSeries: { day: string; total: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    revenueSeries.push({ day: key, total: dayMap.get(key) ?? 0 });
  }

  return {
    summary,
    payout,
    counts: {
      productCount,
      vendorCount,
      customerCount,
      unreadMessages,
      lowStockCount,
      newCustomers30d,
    },
    revenueSeries,
    ordersByStatus,
    topProducts,
    lowStock,
    recentOrders,
  };
}
