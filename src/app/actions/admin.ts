"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { eq, inArray } from "drizzle-orm";
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
import { NAV_CATEGORIES_TAG } from "@/lib/queries";
import { productListReturnUrl } from "@/lib/admin-list";
import { slugify } from "@/lib/vendor";
import { parseImageUrls, replaceProductImages } from "@/lib/products";
import { setCommissionBps, updateStoreSettings } from "@/lib/settings";
import { sendOrderStatusEmail } from "@/lib/email";

export type AdminState = { ok?: boolean; error?: string; message?: string };

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

/** The form's slug field is optional ("auto-from-name"); derive one that no other product uses. */
async function productSlugFrom(name: string, exceptId?: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  for (let i = 0; i < 5; i++) {
    const hit = await db.query.products.findFirst({
      where: eq(products.slug, slug),
      columns: { id: true },
    });
    if (!hit || hit.id === exceptId) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return slug;
}

export async function createProductAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const name = f(formData, "name");
  const partNumber = f(formData, "partNumber");
  const price = dollarsToCents(f(formData, "price"));

  if (!name || !partNumber || price === null) {
    return { error: "Name, part number, and price are required." };
  }
  const slug = f(formData, "slug") || (await productSlugFrom(name));

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
  revalidatePath("/admin/products");
  updateTag(NAV_CATEGORIES_TAG);
  redirect(productListReturnUrl(formData.get("returnTo")));
}

export async function updateProductAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const id = f(formData, "id");
  const name = f(formData, "name");
  const partNumber = f(formData, "partNumber");
  const price = dollarsToCents(f(formData, "price"));

  if (!id) return { error: "Missing product id." };
  if (!name || !partNumber || price === null) {
    return { error: "Name, part number, and price are required." };
  }
  const slug = f(formData, "slug") || (await productSlugFrom(name, id));

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
  updateTag(NAV_CATEGORIES_TAG);
  // Back to the page/search the admin was on, scrolled to the row they edited.
  redirect(productListReturnUrl(formData.get("returnTo"), id));
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
  updateTag(NAV_CATEGORIES_TAG);
}

/** Inline category change from the admin product list. */
export async function setProductCategoryAction(
  productId: string,
  categoryId: string,
): Promise<AdminState> {
  await requireAdmin();
  await db
    .update(products)
    .set({ categoryId: categoryId || null, updatedAt: new Date() })
    .where(eq(products.id, productId));
  revalidatePath("/admin/products");
  updateTag(NAV_CATEGORIES_TAG);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Moves every checked product (form field "ids") into one category. */
export async function bulkSetCategoryAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  const categoryId = f(formData, "categoryId");
  if (ids.length === 0) return { error: "Select at least one product." };
  if (!categoryId) return { error: "Choose a category to move them to." };
  await db
    .update(products)
    .set({ categoryId, updatedAt: new Date() })
    .where(inArray(products.id, ids));
  revalidatePath("/admin/products");
  updateTag(NAV_CATEGORIES_TAG);
  revalidatePath("/", "layout");
  return { ok: true, message: `Moved ${ids.length} product${ids.length === 1 ? "" : "s"}.` };
}

/**
 * Permanent. Images, specs, stock, fitment, cart/wishlist entries, reviews and Q&A cascade away;
 * past orders keep their line items because order_items snapshot name/part #/price (set null).
 */
export async function deleteProductAction(id: string): Promise<void> {
  await requireAdmin();
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/admin/products");
  updateTag(NAV_CATEGORIES_TAG);
  revalidatePath("/", "layout");
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
  updateTag(NAV_CATEGORIES_TAG);
  return { ok: true };
}

export async function deleteCategoryAction(id: string): Promise<void> {
  await requireAdmin();
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/admin/categories");
  updateTag(NAV_CATEGORIES_TAG);
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
