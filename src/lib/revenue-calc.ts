import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { brands, categories, inventory, products } from "@/db/schema";

export type CalcProduct = {
  id: string;
  slug: string;
  name: string;
  partNumber: string;
  brandName: string | null;
  categoryName: string | null;
  priceCents: number;
  stockQty: number;
};

export async function getAdminProductsForCalc(): Promise<CalcProduct[]> {
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      partNumber: products.partNumber,
      priceCents: products.priceCents,
      brandName: brands.name,
      categoryName: categories.name,
      stockQty: sql<number>`COALESCE(${inventory.quantity}, 0)::int`,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(inventory, eq(products.id, inventory.productId))
    .where(and(eq(products.isActive, true), sql`${products.deletedAt} IS NULL`))
    .orderBy(products.name)
    .limit(200);

  return rows;
}
