/** Format an integer cent amount as USD. */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

/** Percentage off, or 0 if there's no saving. */
export function discountPct(priceCents: number, listCents?: number | null): number {
  if (!listCents || listCents <= priceCents) return 0;
  return Math.round((1 - priceCents / listCents) * 100);
}
