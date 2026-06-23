import "server-only";
import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { formatPrice } from "@/lib/format";

export const COUPON_COOKIE_NAME = "brc_coupon";

export type CouponResult =
  | { ok: true; code: string; discountCents: number; label: string }
  | { ok: false; error: string };

export async function validateCoupon(
  rawCode: string,
  subtotalCents: number,
): Promise<CouponResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a code." };

  const c = await db.query.coupons.findFirst({ where: eq(coupons.code, code) });
  if (!c || !c.active) return { ok: false, error: "Invalid or inactive code." };
  if (c.expiresAt && c.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "This code has expired." };
  }
  if (c.maxRedemptions != null && c.timesRedeemed >= c.maxRedemptions) {
    return { ok: false, error: "This code has reached its limit." };
  }
  if (subtotalCents < c.minSubtotalCents) {
    return {
      ok: false,
      error: `Spend ${formatPrice(c.minSubtotalCents)} to use this code.`,
    };
  }

  const discount =
    c.type === "percent"
      ? Math.round((subtotalCents * c.value) / 100)
      : c.value;
  const label =
    c.type === "percent"
      ? `${c.value}% off`
      : `${formatPrice(c.value)} off`;

  return {
    ok: true,
    code,
    discountCents: Math.min(discount, subtotalCents),
    label,
  };
}

export async function getAppliedCouponCode(): Promise<string | null> {
  const store = await cookies();
  return store.get(COUPON_COOKIE_NAME)?.value ?? null;
}

/** Re-validate the cookie coupon against the current subtotal. */
export async function getCartDiscount(
  subtotalCents: number,
): Promise<CouponResult | null> {
  const code = await getAppliedCouponCode();
  if (!code) return null;
  return validateCoupon(code, subtotalCents);
}

export async function incrementRedemption(code: string): Promise<void> {
  await db
    .update(coupons)
    .set({ timesRedeemed: sql`${coupons.timesRedeemed} + 1` })
    .where(eq(coupons.code, code.toUpperCase()));
}
