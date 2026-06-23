"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import {
  hasUserReviewed,
  recomputeProductRating,
  userPurchasedProduct,
} from "@/lib/reviews";

export type ReviewState = { error?: string; ok?: boolean };

export async function submitReviewAction(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in to write a review." };

  const slug = String(formData.get("slug") ?? "").trim();
  const rating = Number(formData.get("rating"));
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!slug) return { error: "Missing product." };
  if (!(rating >= 1 && rating <= 5)) {
    return { error: "Please choose a star rating." };
  }

  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    columns: { id: true },
  });
  if (!product) return { error: "Product not found." };

  if (await hasUserReviewed(product.id, user.id)) {
    return { error: "You've already reviewed this product." };
  }

  const verified = await userPurchasedProduct(user.id, product.id);

  await db.insert(reviews).values({
    productId: product.id,
    userId: user.id,
    authorName: user.name || user.email.split("@")[0],
    rating: Math.round(rating),
    title: title || null,
    body: body || null,
    verifiedPurchase: verified,
  });

  await recomputeProductRating(product.id);
  revalidatePath(`/p/${slug}`);
  return { ok: true };
}
