"use server";

import { revalidatePath } from "next/cache";
import { addItemBySlug, removeItem, setItemQty } from "@/lib/cart";

export async function addToCartAction(slug: string, qty: number) {
  await addItemBySlug(slug, Math.max(1, Math.floor(qty)));
  revalidatePath("/cart");
  return { ok: true as const };
}

export async function updateCartItemAction(productId: string, qty: number) {
  await setItemQty(productId, Math.floor(qty));
  revalidatePath("/cart");
}

export async function removeCartItemAction(productId: string) {
  await removeItem(productId);
  revalidatePath("/cart");
}
