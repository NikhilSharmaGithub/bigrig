import "server-only";
import { and, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
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

export const ADMIN_PRODUCTS_PER_PAGE = 50;

export type AdminProductFilters = {
  q?: string;
  categoryId?: string;
  status?: "active" | "hidden";
  page?: number;
};

/** "ab-12 34" → "AB1234": part numbers are matched ignoring spaces, dashes and dots. */
function partKey(s: string): string {
  return s.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

/**
 * One page of the admin product list. `q` matches part number (also with
 * spaces/dashes ignored), name and description; exact part-number hits sort first.
 */
export async function getAdminProducts(filters: AdminProductFilters = {}) {
  const q = (filters.q ?? "").trim().slice(0, 100);
  const conds: SQL[] = [];
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    const key = partKey(q);
    const anyOf = [
      ilike(products.partNumber, like),
      ilike(products.name, like),
      ilike(products.description, like),
    ];
    if (key) {
      anyOf.push(
        sql`regexp_replace(upper(${products.partNumber}), '[^0-9A-Z]', '', 'g') LIKE ${`%${key}%`}`,
      );
    }
    conds.push(or(...anyOf)!);
  }
  if (filters.categoryId) {
    // A parent category also matches everything filed under its subcategories.
    conds.push(
      or(
        eq(products.categoryId, filters.categoryId),
        sql`${products.categoryId} IN (SELECT "id" FROM "categories" WHERE "parent_id" = ${filters.categoryId})`,
      )!,
    );
  }
  if (filters.status) conds.push(eq(products.isActive, filters.status === "active"));
  const where = conds.length ? and(...conds) : undefined;

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(products)
    .where(where);
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PRODUCTS_PER_PAGE));
  const page = Math.min(Math.max(1, Math.floor(filters.page ?? 1)), pageCount);

  const key = partKey(q);
  const items = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      partNumber: products.partNumber,
      priceCents: products.priceCents,
      isActive: products.isActive,
      brandName: brands.name,
      categoryId: products.categoryId,
      categoryName: categories.name,
      qty: inventory.quantity,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(inventory, eq(inventory.productId, products.id))
    .where(where)
    .orderBy(
      ...(key
        ? [sql`(regexp_replace(upper(${products.partNumber}), '[^0-9A-Z]', '', 'g') = ${key}) DESC`]
        : []),
      desc(products.createdAt),
      desc(products.id),
    )
    .limit(ADMIN_PRODUCTS_PER_PAGE)
    .offset((page - 1) * ADMIN_PRODUCTS_PER_PAGE);

  return { items, total, page, pageCount };
}

/** Parents and their subcategories, for the admin list's category filter. */
export async function getCategoryFilterOptions() {
  const all = await db
    .select({ id: categories.id, name: categories.name, parentId: categories.parentId })
    .from(categories)
    .orderBy(categories.position, categories.name);
  return all
    .filter((c) => !c.parentId)
    .map((parent) => ({
      id: parent.id,
      name: parent.name,
      children: all.filter((c) => c.parentId === parent.id).map((c) => ({ id: c.id, name: c.name })),
    }));
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
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
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
