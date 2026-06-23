import "server-only";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  isNotNull,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import { alias } from "drizzle-orm/pg-core";
import {
  brands,
  categories,
  inventory,
  orderItems,
  productFitment,
  productImages,
  products,
  vehicles,
} from "@/db/schema";

/** Scalar subquery: the lowest-position image URL for the product row. */
const primaryImageSql = sql<string | null>`(
  SELECT url FROM ${productImages}
  WHERE ${productImages.productId} = ${products.id}
  ORDER BY ${productImages.position} ASC
  LIMIT 1
)`;
import type {
  ProductCardItem,
  ProductListResult,
  SortKey,
} from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  Categories                                                                 */
/* -------------------------------------------------------------------------- */

export async function getTopCategories() {
  return db.query.categories.findMany({
    where: (c, { isNull }) => isNull(c.parentId),
    orderBy: (c, { asc }) => asc(c.position),
    with: {
      children: {
        orderBy: (c, { asc }) => asc(c.position),
      },
    },
  });
}

export async function getCategoryBySlug(slug: string) {
  return db.query.categories.findFirst({
    where: eq(categories.slug, slug),
    with: {
      parent: true,
      children: { orderBy: (c, { asc }) => asc(c.position) },
    },
  });
}

/** A category's own id plus all of its child category ids. */
async function categoryAndChildIds(slug: string): Promise<string[]> {
  const cat = await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
    columns: { id: true },
    with: { children: { columns: { id: true } } },
  });
  if (!cat) return [];
  return [cat.id, ...cat.children.map((c) => c.id)];
}

/* -------------------------------------------------------------------------- */
/*  Product listing (PLP / search / vehicle)                                   */
/* -------------------------------------------------------------------------- */

export type ListOpts = {
  categorySlug?: string;
  brandSlugs?: string[];
  q?: string;
  vehicleId?: string;
  vendorId?: string;
  inStockOnly?: boolean;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
};

const EMPTY: ProductListResult = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 24,
  brandFacets: [],
};

function orderByFor(sort: SortKey | undefined) {
  switch (sort) {
    case "price-asc":
      return asc(products.priceCents);
    case "price-desc":
      return desc(products.priceCents);
    case "rating":
      return desc(products.ratingAvg);
    case "newest":
      return desc(products.createdAt);
    default:
      return desc(products.ratingCount);
  }
}

export async function listProducts(opts: ListOpts): Promise<ProductListResult> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = opts.pageSize ?? 24;

  // Conditions that apply to BOTH results and brand facets (everything but brand).
  const baseConds = [eq(products.isActive, true)];

  if (opts.categorySlug) {
    const ids = await categoryAndChildIds(opts.categorySlug);
    if (ids.length === 0) return { ...EMPTY, page, pageSize };
    baseConds.push(inArray(products.categoryId, ids));
  }

  if (opts.q) {
    const term = `%${opts.q}%`;
    baseConds.push(
      or(
        ilike(products.name, term),
        ilike(products.partNumber, term),
        ilike(brands.name, term),
      )!,
    );
  }

  if (opts.vehicleId) {
    baseConds.push(
      sql`EXISTS (SELECT 1 FROM ${productFitment} WHERE ${productFitment.productId} = ${products.id} AND ${productFitment.vehicleId} = ${opts.vehicleId})`,
    );
  }

  if (opts.vendorId) {
    baseConds.push(eq(products.vendorId, opts.vendorId));
  }

  if (opts.inStockOnly) {
    baseConds.push(sql`COALESCE(${inventory.quantity}, 0) > 0`);
  }

  const brandCond = opts.brandSlugs?.length
    ? inArray(brands.slug, opts.brandSlugs)
    : undefined;
  const where = brandCond ? and(...baseConds, brandCond) : and(...baseConds);

  const rows = await db
    .select({
      slug: products.slug,
      name: products.name,
      partNumber: products.partNumber,
      priceCents: products.priceCents,
      listPriceCents: products.listPriceCents,
      ratingAvg: products.ratingAvg,
      ratingCount: products.ratingCount,
      brandName: brands.name,
      qty: inventory.quantity,
      imageUrl: primaryImageSql,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(inventory, eq(inventory.productId, products.id))
    .where(where)
    .orderBy(orderByFor(opts.sort))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const totalRows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(inventory, eq(inventory.productId, products.id))
    .where(where);

  const facetRows = await db
    .select({
      slug: brands.slug,
      name: brands.name,
      c: sql<number>`count(*)::int`,
    })
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(inventory, eq(inventory.productId, products.id))
    .where(and(...baseConds))
    .groupBy(brands.slug, brands.name)
    .orderBy(desc(sql`count(*)`));

  return {
    items: rows.map(toCardItem),
    total: totalRows[0]?.c ?? 0,
    page,
    pageSize,
    brandFacets: facetRows.map((f) => ({
      slug: f.slug,
      name: f.name,
      count: f.c,
    })),
  };
}

type ListRow = {
  slug: string;
  name: string;
  partNumber: string;
  priceCents: number;
  listPriceCents: number | null;
  ratingAvg: string;
  ratingCount: number;
  brandName: string | null;
  qty: number | null;
  imageUrl: string | null;
};

function toCardItem(r: ListRow): ProductCardItem {
  return {
    slug: r.slug,
    name: r.name,
    partNumber: r.partNumber,
    priceCents: r.priceCents,
    listPriceCents: r.listPriceCents,
    ratingAvg: Number(r.ratingAvg),
    ratingCount: r.ratingCount,
    brand: r.brandName ?? "",
    inStock: (r.qty ?? 0) > 0,
    imageUrl: r.imageUrl,
  };
}

/* -------------------------------------------------------------------------- */
/*  Product detail                                                             */
/* -------------------------------------------------------------------------- */

export async function getProductBySlug(slug: string) {
  return db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: {
      brand: true,
      category: { with: { parent: true } },
      vendor: true,
      images: { orderBy: (i, { asc }) => asc(i.position) },
      specs: { orderBy: (sp, { asc }) => asc(sp.position) },
      inventory: true,
      fitment: { with: { vehicle: true } },
    },
  });
}

export type ProductDetail = NonNullable<
  Awaited<ReturnType<typeof getProductBySlug>>
>;

export async function getRelatedProducts(
  categoryId: string | null,
  excludeSlug: string,
  limit = 6,
): Promise<ProductCardItem[]> {
  if (!categoryId) return [];
  const rows = await db
    .select({
      slug: products.slug,
      name: products.name,
      partNumber: products.partNumber,
      priceCents: products.priceCents,
      listPriceCents: products.listPriceCents,
      ratingAvg: products.ratingAvg,
      ratingCount: products.ratingCount,
      brandName: brands.name,
      qty: inventory.quantity,
      imageUrl: primaryImageSql,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(inventory, eq(inventory.productId, products.id))
    .where(
      and(
        eq(products.categoryId, categoryId),
        eq(products.isActive, true),
        sql`${products.slug} <> ${excludeSlug}`,
      ),
    )
    .orderBy(desc(products.ratingCount))
    .limit(limit);
  return rows.map(toCardItem);
}

export async function getTopSellers(limit = 6): Promise<ProductCardItem[]> {
  const rows = await db
    .select({
      slug: products.slug,
      name: products.name,
      partNumber: products.partNumber,
      priceCents: products.priceCents,
      listPriceCents: products.listPriceCents,
      ratingAvg: products.ratingAvg,
      ratingCount: products.ratingCount,
      brandName: brands.name,
      qty: inventory.quantity,
      imageUrl: primaryImageSql,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(inventory, eq(inventory.productId, products.id))
    .where(eq(products.isActive, true))
    .orderBy(desc(products.ratingCount))
    .limit(limit);
  return rows.map(toCardItem);
}

/** Product cards for a specific list of slugs, preserving the given order. */
export async function getProductCardsBySlugs(
  slugs: string[],
): Promise<ProductCardItem[]> {
  if (slugs.length === 0) return [];
  const rows = await db
    .select({
      slug: products.slug,
      name: products.name,
      partNumber: products.partNumber,
      priceCents: products.priceCents,
      listPriceCents: products.listPriceCents,
      ratingAvg: products.ratingAvg,
      ratingCount: products.ratingCount,
      brandName: brands.name,
      qty: inventory.quantity,
      imageUrl: primaryImageSql,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(inventory, eq(inventory.productId, products.id))
    .where(and(eq(products.isActive, true), inArray(products.slug, slugs)));
  const map = new Map(rows.map((r) => [r.slug, toCardItem(r)]));
  return slugs
    .map((s) => map.get(s))
    .filter((x): x is ProductCardItem => Boolean(x));
}

/** Products most often bought in the same orders as the given product. */
export async function getFrequentlyBoughtTogether(
  productId: string,
  limit = 4,
): Promise<ProductCardItem[]> {
  const oi2 = alias(orderItems, "oi2");
  const rows = await db
    .select({ slug: products.slug })
    .from(orderItems)
    .innerJoin(
      oi2,
      and(
        eq(oi2.orderId, orderItems.orderId),
        sql`${oi2.productId} <> ${orderItems.productId}`,
      ),
    )
    .innerJoin(
      products,
      and(eq(products.id, oi2.productId), eq(products.isActive, true)),
    )
    .where(eq(orderItems.productId, productId))
    .groupBy(products.slug)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
  return getProductCardsBySlugs(rows.map((r) => r.slug));
}

export async function getDeals(limit = 24): Promise<ProductCardItem[]> {
  const rows = await db
    .select({
      slug: products.slug,
      name: products.name,
      partNumber: products.partNumber,
      priceCents: products.priceCents,
      listPriceCents: products.listPriceCents,
      ratingAvg: products.ratingAvg,
      ratingCount: products.ratingCount,
      brandName: brands.name,
      qty: inventory.quantity,
      imageUrl: primaryImageSql,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(inventory, eq(inventory.productId, products.id))
    .where(
      and(
        eq(products.isActive, true),
        isNotNull(products.listPriceCents),
        gt(products.listPriceCents, products.priceCents),
      ),
    )
    .orderBy(
      desc(
        sql`(${products.listPriceCents} - ${products.priceCents})::numeric / NULLIF(${products.listPriceCents}, 0)`,
      ),
    )
    .limit(limit);
  return rows.map(toCardItem);
}

/* -------------------------------------------------------------------------- */
/*  Brands                                                                     */
/* -------------------------------------------------------------------------- */

export async function getAllBrands() {
  return db.select().from(brands).orderBy(asc(brands.name));
}

export async function getBrandBySlug(slug: string) {
  return db.query.brands.findFirst({ where: eq(brands.slug, slug) });
}

/* -------------------------------------------------------------------------- */
/*  Vehicles (shop-by-vehicle finder)                                          */
/* -------------------------------------------------------------------------- */

export async function getVehicleMakes(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ make: vehicles.make })
    .from(vehicles)
    .orderBy(asc(vehicles.make));
  return rows.map((r) => r.make);
}

export async function getVehiclesForMake(make: string) {
  return db
    .select()
    .from(vehicles)
    .where(eq(vehicles.make, make))
    .orderBy(asc(vehicles.model));
}

export async function getVehicleById(id: string) {
  return db.query.vehicles.findFirst({ where: eq(vehicles.id, id) });
}
