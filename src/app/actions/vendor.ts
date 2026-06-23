"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { inventory, products, vendors } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getVendorForUser, requireVendor, slugify } from "@/lib/vendor";
import { parseImageUrls, replaceProductImages } from "@/lib/products";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

function originFromHeaders(h: Headers): string {
  return (
    h.get("origin") ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "http://localhost:3000"
  );
}

export type VendorState = { error?: string; ok?: boolean };

function f(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function dollarsToCents(v: string): number | null {
  if (!v) return null;
  const n = Number(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = base;
  for (let i = 0; i < 5 && (await exists(slug)); i++) {
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return slug;
}

export async function createVendorAction(
  _prev: VendorState,
  formData: FormData,
): Promise<VendorState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const existing = await getVendorForUser(user.id);
  if (existing) redirect("/vendor");

  const storeName = f(formData, "storeName");
  const bio = f(formData, "bio");
  if (!storeName) return { error: "Store name is required." };

  const slug = await uniqueSlug(slugify(storeName), async (s) => {
    const hit = await db.query.vendors.findFirst({
      where: eq(vendors.slug, s),
      columns: { id: true },
    });
    return Boolean(hit);
  });

  await db.insert(vendors).values({
    userId: user.id,
    storeName,
    slug,
    bio: bio || null,
    status: "approved",
  });

  redirect("/vendor");
}

export async function createVendorProductAction(
  _prev: VendorState,
  formData: FormData,
): Promise<VendorState> {
  const { vendor } = await requireVendor();
  const name = f(formData, "name");
  const slug = f(formData, "slug") || slugify(name);
  const partNumber = f(formData, "partNumber");
  const price = dollarsToCents(f(formData, "price"));

  if (!name || !partNumber || price === null) {
    return { error: "Name, part number, and price are required." };
  }

  let productId: string;
  try {
    const [p] = await db
      .insert(products)
      .values({
        name,
        slug,
        partNumber,
        vendorId: vendor.id,
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
      warehouse: vendor.storeName,
    });
  } catch {
    return { error: "Could not create product — try a different slug." };
  }

  await replaceProductImages(productId, parseImageUrls(f(formData, "images")));
  redirect("/vendor/products");
}

export async function updateVendorProductAction(
  _prev: VendorState,
  formData: FormData,
): Promise<VendorState> {
  const { vendor } = await requireVendor();
  const id = f(formData, "id");
  const name = f(formData, "name");
  const slug = f(formData, "slug") || slugify(name);
  const partNumber = f(formData, "partNumber");
  const price = dollarsToCents(f(formData, "price"));

  if (!id) return { error: "Missing product id." };
  if (!name || !partNumber || price === null) {
    return { error: "Name, part number, and price are required." };
  }

  const owned = await db.query.products.findFirst({
    where: and(eq(products.id, id), eq(products.vendorId, vendor.id)),
    columns: { id: true },
  });
  if (!owned) return { error: "Product not found." };

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
  const inv = await db.query.inventory.findFirst({
    where: eq(inventory.productId, id),
  });
  if (inv) {
    await db
      .update(inventory)
      .set({ quantity: qty, updatedAt: new Date() })
      .where(eq(inventory.productId, id));
  } else {
    await db.insert(inventory).values({ productId: id, quantity: qty });
  }

  await replaceProductImages(id, parseImageUrls(f(formData, "images")));
  revalidatePath("/vendor/products");
  redirect("/vendor/products");
}

export async function deleteVendorProductAction(id: string): Promise<void> {
  const { vendor } = await requireVendor();
  await db
    .delete(products)
    .where(and(eq(products.id, id), eq(products.vendorId, vendor.id)));
  revalidatePath("/vendor/products");
}

/** Start (or resume) Stripe Connect onboarding for the vendor's payouts. */
export async function connectStripeAction(
  _prev: VendorState,
  _formData: FormData,
): Promise<VendorState> {
  const { vendor } = await requireVendor();
  if (!isStripeConfigured()) {
    return { error: "Payouts aren't available yet — Stripe isn't configured." };
  }

  const stripe = getStripe();
  let accountId = vendor.stripeAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      metadata: { vendorId: vendor.id },
    });
    accountId = account.id;
    await db
      .update(vendors)
      .set({ stripeAccountId: accountId })
      .where(eq(vendors.id, vendor.id));
  }

  const origin = originFromHeaders(await headers());
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/vendor/connect/refresh`,
    return_url: `${origin}/vendor/connect/return`,
    type: "account_onboarding",
  });

  redirect(link.url);
}

/** Re-check Stripe Connect status and flip payouts on when ready. */
export async function refreshVendorPayoutStatus(): Promise<boolean> {
  const { vendor } = await requireVendor();
  if (!vendor.stripeAccountId || !isStripeConfigured()) return false;
  try {
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(vendor.stripeAccountId);
    const enabled = Boolean(account.charges_enabled && account.payouts_enabled);
    await db
      .update(vendors)
      .set({ payoutsEnabled: enabled })
      .where(eq(vendors.id, vendor.id));
    return enabled;
  } catch {
    return false;
  }
}
