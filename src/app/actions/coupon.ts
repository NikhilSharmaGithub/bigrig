"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCart } from "@/lib/cart";
import { COUPON_COOKIE_NAME, validateCoupon } from "@/lib/coupons";

export type CouponState = { error?: string; ok?: boolean; label?: string };

export async function applyCouponAction(
  _prev: CouponState,
  formData: FormData,
): Promise<CouponState> {
  const code = String(formData.get("code") ?? "").trim();
  const cart = await getCart();
  const result = await validateCoupon(code, cart.subtotalCents);
  if (!result.ok) return { error: result.error };

  const store = await cookies();
  store.set(COUPON_COOKIE_NAME, result.code, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  revalidatePath("/cart");
  return { ok: true, label: result.label };
}

export async function removeCouponAction(): Promise<void> {
  const store = await cookies();
  store.delete(COUPON_COOKIE_NAME);
  revalidatePath("/cart");
}
