"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { toggleWishlist } from "@/lib/wishlist";

export type WishlistResult = {
  wishlisted?: boolean;
  needsAuth?: boolean;
  error?: string;
};

export async function toggleWishlistAction(
  slug: string,
): Promise<WishlistResult> {
  const user = await getCurrentUser();
  if (!user) return { needsAuth: true };

  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    columns: { id: true },
  });
  if (!product) return { error: "Product not found." };

  const wishlisted = await toggleWishlist(user.id, product.id);
  revalidatePath("/account/wishlist");
  return { wishlisted };
}
