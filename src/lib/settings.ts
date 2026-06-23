import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { platformSettings } from "@/db/schema";

const DEFAULTS = {
  commissionBps: 1000, // 10%
  taxBps: 0,
  flatShippingCents: 1500,
  freeShipThresholdCents: 9900,
};

export type StoreSettings = typeof DEFAULTS;

export async function getStoreSettings(): Promise<StoreSettings> {
  const row = await db.query.platformSettings.findFirst({
    where: eq(platformSettings.id, 1),
  });
  return {
    commissionBps: row?.commissionBps ?? DEFAULTS.commissionBps,
    taxBps: row?.taxBps ?? DEFAULTS.taxBps,
    flatShippingCents: row?.flatShippingCents ?? DEFAULTS.flatShippingCents,
    freeShipThresholdCents:
      row?.freeShipThresholdCents ?? DEFAULTS.freeShipThresholdCents,
  };
}

export async function updateStoreSettings(
  patch: Partial<StoreSettings>,
): Promise<void> {
  const existing = await db.query.platformSettings.findFirst({
    where: eq(platformSettings.id, 1),
  });
  if (existing) {
    await db
      .update(platformSettings)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(platformSettings.id, 1));
  } else {
    await db.insert(platformSettings).values({ id: 1, ...DEFAULTS, ...patch });
  }
}

export async function getCommissionBps(): Promise<number> {
  return (await getStoreSettings()).commissionBps;
}

export async function setCommissionBps(bps: number): Promise<void> {
  await updateStoreSettings({ commissionBps: Math.max(0, Math.min(5000, Math.round(bps))) });
}

/** Platform's cut of an amount, in cents. */
export function commissionFor(amountCents: number, bps: number): number {
  return Math.round((amountCents * bps) / 10000);
}

/** Sales tax on an amount, in cents. */
export function taxFor(amountCents: number, bps: number): number {
  return Math.round((amountCents * bps) / 10000);
}

/** Shipping cost given the subtotal and store settings. */
export function shippingFor(
  subtotalCents: number,
  settings: Pick<StoreSettings, "flatShippingCents" | "freeShipThresholdCents">,
): number {
  return subtotalCents >= settings.freeShipThresholdCents
    ? 0
    : settings.flatShippingCents;
}
