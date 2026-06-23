import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products, reviews } from "@/db/schema";

const PAID_STATUSES = ["paid", "processing", "shipped", "delivered"] as const;

export async function getProductReviews(productId: string) {
  return db
    .select()
    .from(reviews)
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt))
    .limit(50);
}

export type ReviewSummary = {
  count: number;
  avg: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
};

export async function getReviewSummary(productId: string): Promise<ReviewSummary> {
  const rows = await db
    .select({ rating: reviews.rating, n: sql<number>`count(*)::int` })
    .from(reviews)
    .where(eq(reviews.productId, productId))
    .groupBy(reviews.rating);

  const breakdown: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let count = 0;
  let sum = 0;
  for (const r of rows) {
    const k = Math.min(5, Math.max(1, r.rating)) as 1 | 2 | 3 | 4 | 5;
    breakdown[k] = r.n;
    count += r.n;
    sum += r.rating * r.n;
  }
  return { count, avg: count > 0 ? sum / count : 0, breakdown };
}

export async function hasUserReviewed(
  productId: string,
  userId: string,
): Promise<boolean> {
  const hit = await db.query.reviews.findFirst({
    where: and(eq(reviews.productId, productId), eq(reviews.userId, userId)),
    columns: { id: true },
  });
  return Boolean(hit);
}

export async function userPurchasedProduct(
  userId: string,
  productId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orderItems.productId, productId),
        eq(orders.userId, userId),
        inArray(orders.status, [...PAID_STATUSES]),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

/** Recompute a product's aggregate rating from its reviews. */
export async function recomputeProductRating(productId: string): Promise<void> {
  const [agg] = await db
    .select({
      avg: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
      n: sql<number>`count(*)::int`,
    })
    .from(reviews)
    .where(eq(reviews.productId, productId));

  await db
    .update(products)
    .set({
      ratingAvg: Number(agg?.avg ?? 0).toFixed(1),
      ratingCount: agg?.n ?? 0,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));
}
