import "server-only";
import { redirect } from "next/navigation";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  inventory,
  orderItems,
  orders,
  products,
  vendors,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

/** For vendor pages: returns the current user's store, or redirects. */
export async function requireVendor() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const vendor = await getVendorForUser(user.id);
  if (!vendor) redirect("/sell");
  return { user, vendor };
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "store"
  );
}

export async function getVendorForUser(userId: string) {
  return db.query.vendors.findFirst({ where: eq(vendors.userId, userId) });
}

export async function getVendorBySlug(slug: string) {
  return db.query.vendors.findFirst({ where: eq(vendors.slug, slug) });
}

export async function getVendorProducts(vendorId: string) {
  return db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      partNumber: products.partNumber,
      priceCents: products.priceCents,
      isActive: products.isActive,
      qty: inventory.quantity,
    })
    .from(products)
    .leftJoin(inventory, eq(inventory.productId, products.id))
    .where(eq(products.vendorId, vendorId))
    .orderBy(desc(products.createdAt));
}

export async function getVendorProductById(vendorId: string, id: string) {
  return db.query.products.findFirst({
    where: and(eq(products.id, id), eq(products.vendorId, vendorId)),
    with: {
      inventory: true,
      images: { orderBy: (i, { asc }) => asc(i.position) },
    },
  });
}

export async function getVendorStats(vendorId: string) {
  const [p] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(products)
    .where(eq(products.vendorId, vendorId));

  const [sold] = await db
    .select({
      units: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)::int`,
      revenue: sql<number>`COALESCE(SUM(${orderItems.lineTotalCents}), 0)::int`,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(products.vendorId, vendorId),
        sql`${orders.status} IN ('paid','processing','shipped','delivered')`,
      ),
    );

  return {
    productCount: p?.n ?? 0,
    unitsSold: sold?.units ?? 0,
    revenueCents: sold?.revenue ?? 0,
  };
}

export async function getVendorOrderLines(vendorId: string) {
  return db
    .select({
      orderId: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      createdAt: orders.createdAt,
      name: orderItems.name,
      quantity: orderItems.quantity,
      lineTotalCents: orderItems.lineTotalCents,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(eq(products.vendorId, vendorId))
    .orderBy(desc(orders.createdAt));
}
