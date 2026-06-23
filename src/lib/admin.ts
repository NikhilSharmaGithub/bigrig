import "server-only";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  brands,
  categories,
  contactMessages,
  coupons,
  inventory,
  orders,
  products,
  returns,
  users,
  vendors,
} from "@/db/schema";

const COUNTED_REVENUE_STATUSES = [
  "paid",
  "processing",
  "shipped",
  "delivered",
] as const;

export async function getAdminStats() {
  const [p] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(products);
  const [o] = await db.select({ n: sql<number>`count(*)::int` }).from(orders);
  const [rev] = await db
    .select({ n: sql<number>`COALESCE(SUM(${orders.totalCents}), 0)::int` })
    .from(orders)
    .where(inArray(orders.status, [...COUNTED_REVENUE_STATUSES]));
  const [pr] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(returns)
    .where(eq(returns.status, "requested"));

  return {
    productCount: p?.n ?? 0,
    orderCount: o?.n ?? 0,
    revenueCents: rev?.n ?? 0,
    pendingReturns: pr?.n ?? 0,
  };
}

export async function getAdminProducts() {
  return db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      partNumber: products.partNumber,
      priceCents: products.priceCents,
      isActive: products.isActive,
      brandName: brands.name,
      qty: inventory.quantity,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(inventory, eq(inventory.productId, products.id))
    .orderBy(desc(products.createdAt));
}

export async function getAdminProductById(id: string) {
  return db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      inventory: true,
      images: { orderBy: (i, { asc }) => asc(i.position) },
    },
  });
}

/** Leaf categories (those with a parent) — the level products attach to. */
export async function getSelectableCategories() {
  const all = await db
    .select({
      id: categories.id,
      name: categories.name,
      parentId: categories.parentId,
    })
    .from(categories)
    .orderBy(categories.name);
  const nameById = new Map(all.map((c) => [c.id, c.name]));
  return all
    .filter((c) => c.parentId !== null)
    .map((c) => ({
      id: c.id,
      label: `${nameById.get(c.parentId!) ?? ""} › ${c.name}`,
    }));
}

export async function getAdminOrders() {
  return db.query.orders.findMany({
    orderBy: (o, { desc }) => desc(o.createdAt),
    with: { items: { columns: { id: true } } },
  });
}

export async function getAdminOrderById(id: string) {
  return db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { items: true, returns: true },
  });
}

export async function getAdminReturns() {
  return db.query.returns.findMany({
    orderBy: (r, { desc }) => desc(r.createdAt),
    with: {
      order: { columns: { orderNumber: true, totalCents: true } },
    },
  });
}

export async function getContactMessages() {
  return db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt));
}

export async function getAdminCategories() {
  const all = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      parentId: categories.parentId,
    })
    .from(categories)
    .orderBy(categories.name);
  const nameById = new Map(all.map((c) => [c.id, c.name]));
  return all.map((c) => ({
    ...c,
    parentName: c.parentId ? (nameById.get(c.parentId) ?? null) : null,
    productCount: 0,
  }));
}

export async function getAdminCoupons() {
  return db.select().from(coupons).orderBy(desc(coupons.createdAt));
}

export async function getAdminVendors() {
  return db
    .select({
      id: vendors.id,
      storeName: vendors.storeName,
      slug: vendors.slug,
      status: vendors.status,
      createdAt: vendors.createdAt,
      email: users.email,
      productCount: sql<number>`(SELECT count(*)::int FROM products WHERE products.vendor_id = ${vendors.id})`,
    })
    .from(vendors)
    .leftJoin(users, eq(vendors.userId, users.id))
    .orderBy(desc(vendors.createdAt));
}
