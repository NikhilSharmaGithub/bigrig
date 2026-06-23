import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, wishlistItems } from "@/db/schema";
import { getProductCardsBySlugs } from "@/lib/queries";
import type { ProductCardItem } from "@/lib/types";

export async function getWishlistSlugs(userId: string): Promise<string[]> {
  const rows = await db
    .select({ slug: products.slug })
    .from(wishlistItems)
    .innerJoin(products, eq(wishlistItems.productId, products.id))
    .where(eq(wishlistItems.userId, userId))
    .orderBy(desc(wishlistItems.createdAt));
  return rows.map((r) => r.slug);
}

export async function getWishlistProducts(
  userId: string,
): Promise<ProductCardItem[]> {
  const slugs = await getWishlistSlugs(userId);
  return getProductCardsBySlugs(slugs);
}

export async function getWishlistCount(userId: string): Promise<number> {
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, userId));
  return r?.n ?? 0;
}

/** Add if missing, remove if present. Returns the new wishlisted state. */
export async function toggleWishlist(
  userId: string,
  productId: string,
): Promise<boolean> {
  const existing = await db.query.wishlistItems.findFirst({
    where: and(
      eq(wishlistItems.userId, userId),
      eq(wishlistItems.productId, productId),
    ),
    columns: { id: true },
  });
  if (existing) {
    await db.delete(wishlistItems).where(eq(wishlistItems.id, existing.id));
    return false;
  }
  await db.insert(wishlistItems).values({ userId, productId });
  return true;
}
