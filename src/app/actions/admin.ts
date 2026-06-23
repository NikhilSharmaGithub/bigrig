"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
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
  vendorPayouts,
  vendors,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/vendor";
import { parseImageUrls, replaceProductImages } from "@/lib/products";
import { setCommissionBps, updateStoreSettings } from "@/lib/settings";
import { sendOrderStatusEmail } from "@/lib/email";

export type AdminState = { ok?: boolean; error?: string };

type OrderStatus = (typeof orders.$inferInsert)["status"];
type ReturnStatus = (typeof returns.$inferInsert)["status"];

const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;
const RETURN_STATUSES = [
  "requested",
  "approved",
  "rejected",
  "received",
  "refunded",
] as const;

function f(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function dollarsToCents(v: string): number | null {
  if (!v) return null;
  const n = Number(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

export async function createProductAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const name = f(formData, "name");
  const slug = f(formData, "slug");
  const partNumber = f(formData, "partNumber");
  const price = dollarsToCents(f(formData, "price"));

  if (!name || !slug || !partNumber || price === null) {
    return { error: "Name, slug, part number, and price are required." };
  }

  let productId: string;
  try {
    const [p] = await db
      .insert(products)
      .values({
        name,
        slug,
        partNumber,
        brandId: f(formData, "brandId") || null,
        categoryId: f(formData, "categoryId") || null,
        priceCents: price,
        listPriceCents: dollarsToCents(f(formData, "listPrice")),
        description: f(formData, "description") || null,
        highlights: f(formData, "highlights") || null,
        keywords: f(formData, "keywords") || null,
        metaTitle: f(formData, "metaTitle") || null,
        metaDescription: f(formData, "metaDescription") || null,
        isActive: true,
      })
      .returning({ id: products.id });
    productId = p.id;
    await db.insert(inventory).values({
      productId,
      quantity: Number(f(formData, "qty")) || 0,
      warehouse: "Dallas, TX",
    });
  } catch {
    return { error: "Could not create product — is the slug unique?" };
  }

  await replaceProductImages(productId, parseImageUrls(f(formData, "images")));
  redirect("/admin/products");
}

export async function updateProductAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const id = f(formData, "id");
  const name = f(formData, "name");
  const slug = f(formData, "slug");
  const partNumber = f(formData, "partNumber");
  const price = dollarsToCents(f(formData, "price"));

  if (!id) return { error: "Missing product id." };
  if (!name || !slug || !partNumber || price === null) {
    return { error: "Name, slug, part number, and price are required." };
  }

  await db
    .update(products)
    .set({
      name,
      slug,
      partNumber,
      brandId: f(formData, "brandId") || null,
      categoryId: f(formData, "categoryId") || null,
      priceCents: price,
      listPriceCents: dollarsToCents(f(formData, "listPrice")),
      description: f(formData, "description") || null,
      highlights: f(formData, "highlights") || null,
      keywords: f(formData, "keywords") || null,
      metaTitle: f(formData, "metaTitle") || null,
      metaDescription: f(formData, "metaDescription") || null,
      isActive: formData.get("isActive") === "on",
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  const qty = Number(f(formData, "qty")) || 0;
  const existing = await db.query.inventory.findFirst({
    where: eq(inventory.productId, id),
  });
  if (existing) {
    await db
      .update(inventory)
      .set({ quantity: qty, updatedAt: new Date() })
      .where(eq(inventory.productId, id));
  } else {
    await db.insert(inventory).values({ productId: id, quantity: qty });
  }

  await replaceProductImages(id, parseImageUrls(f(formData, "images")));
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function toggleProductActiveAction(
  id: string,
  makeActive: boolean,
): Promise<void> {
  await requireAdmin();
  await db
    .update(products)
    .set({ isActive: makeActive, updatedAt: new Date() })
    .where(eq(products.id, id));
  revalidatePath("/admin/products");
}

export async function updateOrderStatusAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const id = f(formData, "id");
  const status = f(formData, "status");
  if (!id || !ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
    return { error: "Invalid status." };
  }
  await db
    .update(orders)
    .set({ status: status as OrderStatus, updatedAt: new Date() })
    .where(eq(orders.id, id));

  // Notify the customer for shipping-related status changes.
  if (["shipped", "delivered", "cancelled", "refunded"].includes(status)) {
    const ord = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      columns: { email: true, orderNumber: true },
    });
    if (ord?.email) void sendOrderStatusEmail(ord.email, ord.orderNumber, status);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true };
}

export async function updateReturnStatusAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const id = f(formData, "id");
  const status = f(formData, "status");
  if (
    !id ||
    !RETURN_STATUSES.includes(status as (typeof RETURN_STATUSES)[number])
  ) {
    return { error: "Invalid status." };
  }

  let refundCents: number | undefined;
  if (status === "refunded") {
    const ret = await db.query.returns.findFirst({
      where: eq(returns.id, id),
      with: { order: { columns: { totalCents: true } } },
    });
    refundCents = ret?.order?.totalCents;
  }

  await db
    .update(returns)
    .set({
      status: status as ReturnStatus,
      ...(refundCents != null ? { refundCents } : {}),
      updatedAt: new Date(),
    })
    .where(eq(returns.id, id));

  revalidatePath("/admin/returns");
  return { ok: true };
}

export async function markMessageReadAction(
  id: string,
  makeRead: boolean,
): Promise<void> {
  await requireAdmin();
  await db
    .update(contactMessages)
    .set({ isRead: makeRead })
    .where(eq(contactMessages.id, id));
  revalidatePath("/admin/messages");
}

type VendorStatus = (typeof vendors.$inferInsert)["status"];
const VENDOR_STATUSES = ["pending", "approved", "suspended"] as const;

export async function updateVendorStatusAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const id = f(formData, "id");
  const status = f(formData, "status");
  if (
    !id ||
    !VENDOR_STATUSES.includes(status as (typeof VENDOR_STATUSES)[number])
  ) {
    return { error: "Invalid status." };
  }

  await db
    .update(vendors)
    .set({ status: status as VendorStatus })
    .where(eq(vendors.id, id));

  // Hide a suspended store's listings; restore them on approval.
  if (status === "suspended") {
    await db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(products.vendorId, id));
  } else if (status === "approved") {
    await db
      .update(products)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(products.vendorId, id));
  }

  revalidatePath("/admin/vendors");
  return { ok: true };
}

export async function setCommissionAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const pct = Number(f(formData, "commissionPercent"));
  if (!Number.isFinite(pct) || pct < 0 || pct > 50) {
    return { error: "Commission must be between 0 and 50%." };
  }
  await setCommissionBps(Math.round(pct * 100));
  revalidatePath("/admin/payouts");
  return { ok: true };
}

/** Record a manual payout to a vendor (e.g. paid outside Stripe). */
export async function recordPayoutAction(
  vendorId: string,
  amountCents: number,
): Promise<void> {
  await requireAdmin();
  if (amountCents <= 0) return;
  await db.insert(vendorPayouts).values({
    vendorId,
    amountCents,
    status: "paid",
    note: "Manual payout recorded by admin",
  });
  revalidatePath("/admin/payouts");
}

export async function createCouponAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const code = f(formData, "code").toUpperCase().replace(/\s+/g, "");
  const type = f(formData, "type") === "fixed" ? "fixed" : "percent";
  const rawValue = Number(f(formData, "value"));
  const minDollars = Number(f(formData, "minSubtotal")) || 0;
  const maxRedemptions = Number(f(formData, "maxRedemptions")) || null;

  if (!code) return { error: "Enter a code." };
  if (!Number.isFinite(rawValue) || rawValue <= 0) {
    return { error: "Enter a valid discount value." };
  }
  if (type === "percent" && rawValue > 100) {
    return { error: "Percent can't exceed 100." };
  }

  // percent stored as whole number; fixed stored as cents.
  const value = type === "percent" ? Math.round(rawValue) : Math.round(rawValue * 100);

  try {
    await db.insert(coupons).values({
      code,
      type,
      value,
      minSubtotalCents: Math.round(minDollars * 100),
      maxRedemptions,
    });
  } catch {
    return { error: "That code already exists." };
  }
  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function toggleCouponAction(
  id: string,
  active: boolean,
): Promise<void> {
  await requireAdmin();
  await db.update(coupons).set({ active }).where(eq(coupons.id, id));
  revalidatePath("/admin/coupons");
}

/** Minimal CSV parser supporting quoted fields and escaped quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

export type ImportState = { error?: string; summary?: string };

export async function importProductsAction(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  await requireAdmin();
  const csv = String(formData.get("csv") ?? "").trim();
  if (!csv) return { error: "Paste some CSV first." };

  const rows = parseCsv(csv);
  if (rows.length < 2) {
    return { error: "Need a header row and at least one product row." };
  }
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (n: string) => header.indexOf(n);
  const col = {
    name: idx("name"),
    part: idx("partnumber"),
    price: idx("price"),
    list: idx("listprice"),
    cat: idx("category"),
    brand: idx("brand"),
    qty: idx("qty"),
    desc: idx("description"),
    img: idx("image"),
  };
  if (col.name < 0 || col.part < 0 || col.price < 0) {
    return { error: "CSV must include columns: name, partNumber, price." };
  }

  const cats = await db.select({ id: categories.id, slug: categories.slug }).from(categories);
  const catMap = new Map(cats.map((c) => [c.slug, c.id]));
  const brs = await db.select({ id: brands.id, slug: brands.slug }).from(brands);
  const brandMap = new Map(brs.map((b) => [b.slug, b.id]));

  let created = 0;
  const errors: string[] = [];
  const num = (s: string) => Number(s.replace(/[^0-9.]/g, ""));

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const get = (i: number) => (i >= 0 && i < cells.length ? cells[i].trim() : "");
    const name = get(col.name);
    const part = get(col.part);
    const price = num(get(col.price));
    if (!name || !part || !Number.isFinite(price) || price <= 0) {
      errors.push(`Row ${r + 1}: missing name/partNumber/price`);
      continue;
    }
    const list = num(get(col.list));
    const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
    try {
      const [p] = await db
        .insert(products)
        .values({
          name,
          slug,
          partNumber: part,
          priceCents: Math.round(price * 100),
          listPriceCents: Number.isFinite(list) && list > 0 ? Math.round(list * 100) : null,
          categoryId: catMap.get(get(col.cat)) ?? null,
          brandId: brandMap.get(get(col.brand)) ?? null,
          description: get(col.desc) || null,
          isActive: true,
        })
        .returning({ id: products.id });
      await db.insert(inventory).values({
        productId: p.id,
        quantity: Number(get(col.qty)) || 0,
      });
      const img = get(col.img);
      if (/^https?:\/\//i.test(img)) await replaceProductImages(p.id, [img]);
      created++;
    } catch {
      errors.push(`Row ${r + 1}: insert failed`);
    }
  }

  revalidatePath("/admin/products");
  return {
    summary: `Imported ${created} product${created === 1 ? "" : "s"}.${
      errors.length ? ` Skipped ${errors.length}: ${errors.slice(0, 4).join("; ")}` : ""
    }`,
  };
}

export async function createCategoryAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const name = f(formData, "name");
  if (!name) return { error: "Enter a name." };
  const slug = f(formData, "slug") || slugify(name);
  const parentId = f(formData, "parentId") || null;
  try {
    await db.insert(categories).values({
      name,
      slug,
      parentId,
      blurb: f(formData, "blurb") || null,
    });
  } catch {
    return { error: "Could not create — is the slug unique?" };
  }
  revalidatePath("/admin/categories");
  return { ok: true };
}

export async function deleteCategoryAction(id: string): Promise<void> {
  await requireAdmin();
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/admin/categories");
}

export async function createBrandAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const name = f(formData, "name");
  if (!name) return { error: "Enter a name." };
  const slug = f(formData, "slug") || slugify(name);
  try {
    await db.insert(brands).values({
      name,
      slug,
      description: f(formData, "description") || null,
    });
  } catch {
    return { error: "Could not create — is the slug unique?" };
  }
  revalidatePath("/admin/brands");
  return { ok: true };
}

export async function deleteBrandAction(id: string): Promise<void> {
  await requireAdmin();
  await db.delete(brands).where(eq(brands.id, id));
  revalidatePath("/admin/brands");
}

export async function updateStoreSettingsAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const taxPct = Number(f(formData, "taxPercent"));
  const flatShip = Number(f(formData, "flatShipping"));
  const freeThreshold = Number(f(formData, "freeShipThreshold"));

  if (!Number.isFinite(taxPct) || taxPct < 0 || taxPct > 30) {
    return { error: "Tax must be between 0 and 30%." };
  }
  if (!Number.isFinite(flatShip) || flatShip < 0) {
    return { error: "Enter a valid shipping amount." };
  }
  if (!Number.isFinite(freeThreshold) || freeThreshold < 0) {
    return { error: "Enter a valid free-shipping threshold." };
  }

  await updateStoreSettings({
    taxBps: Math.round(taxPct * 100),
    flatShippingCents: Math.round(flatShip * 100),
    freeShipThresholdCents: Math.round(freeThreshold * 100),
  });
  revalidatePath("/admin/settings");
  return { ok: true };
}
