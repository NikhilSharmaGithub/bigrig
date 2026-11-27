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

/** How long one dashboard section may take before it is shown as unavailable. */
const SECTION_TIMEOUT_MS = 8000;

async function scalar(query: PromiseLike<{ n: number }[]>): Promise<number> {
  const rows = await query;
  return rows[0]?.n ?? 0;
}

/**
 * Runs one dashboard section with a time limit. If it fails or is too slow, the
 * section falls back to an empty value (and is listed in `degraded`) so one stuck
 * query can't hang or break the whole dashboard.
 */
async function section<T>(
  name: string,
  work: PromiseLike<T>,
  fallback: T,
  degraded: string[],
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(work),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`timed out after ${SECTION_TIMEOUT_MS}ms`)),
          SECTION_TIMEOUT_MS,
        );
      }),
    ]);
  } catch (err) {
    console.error(`[dashboard] section "${name}" unavailable:`, err);
    degraded.push(name);
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

export async function getDashboardData() {
  // Revenue per day for the last 14 days (zero-filled).
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - 13);

  const degraded: string[] = [];

  // All dashboard queries are independent, so run them in one parallel batch
  // instead of ~15 sequential database round trips (which could exceed the
  // serverless function time limit on a slow connection).
  const [
    summary,
    payout,
    [
      productCount,
      vendorCount,
      customerCount,
      unreadMessages,
      lowStockCount,
      newCustomers30d,
    ],
    dayRows,
    ordersByStatus,
    topProducts,
    lowStock,
    recentOrders,
  ] = await Promise.all([
    section(
      "revenue summary",
      getRevenueSummary(),
      // Only the fields the dashboard reads; shown as zeros when unavailable.
      {
        grossCents: 0,
        netCents: 0,
        paidOrders: 0,
        pendingOrders: 0,
      } as Awaited<ReturnType<typeof getRevenueSummary>>,
      degraded,
    ),
    section(
      "vendor payouts",
      getPayoutOverview(),
      {
        platformCommissionCents: 0,
        totalOwedCents: 0,
        rows: [],
      } as unknown as Awaited<ReturnType<typeof getPayoutOverview>>,
      degraded,
    ),
    section(
      "counts",
      Promise.all([
        scalar(
          db
            .select({ n: sql<number>`count(*)::int` })
            .from(products)
            .where(sql`${products.deletedAt} IS NULL`),
        ),
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
            .where(
              sql`${inventory.quantity} < 10 AND ${products.deletedAt} IS NULL`,
            ),
        ),
        scalar(
          db
            .select({ n: sql<number>`count(*)::int` })
            .from(users)
            .where(gte(users.createdAt, sql`now() - interval '30 days'`)),
        ),
      ]),
      [0, 0, 0, 0, 0, 0] as number[],
      degraded,
    ) as Promise<number[]>,
    section(
      "revenue by day",
      db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
          total: sql<number>`COALESCE(SUM(${orders.totalCents}), 0)::int`,
        })
        .from(orders)
        .where(
          and(
            inArray(orders.status, [...PAID_STATUSES]),
            gte(orders.createdAt, since),
          ),
        )
        .groupBy(sql`date_trunc('day', ${orders.createdAt})`),
      [],
      degraded,
    ),
    section(
      "orders by status",
      db
        .select({ status: orders.status, n: sql<number>`count(*)::int` })
        .from(orders)
        .groupBy(orders.status),
      [],
      degraded,
    ),
    section(
      "top products",
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
      [],
      degraded,
    ),
    section(
      "low stock",
      db
        .select({
          name: products.name,
          slug: products.slug,
          qty: inventory.quantity,
        })
        .from(products)
        .innerJoin(inventory, eq(inventory.productId, products.id))
        .where(
          sql`${inventory.quantity} < 10 AND ${products.deletedAt} IS NULL`,
        )
        .orderBy(inventory.quantity)
        .limit(8),
      [],
      degraded,
    ),
    section(
      "recent orders",
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
      [],
      degraded,
    ),
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
    /** Names of sections that failed or timed out (shown as a notice). */
    degraded,
  };
}
